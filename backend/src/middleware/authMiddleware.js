const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user info to request
            req.user = decoded;

            // Backward-compatibility for codepaths that expect _id
            if (!req.user._id && req.user.id) {
                req.user._id = req.user.id;
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized to access this route` });
        }
        next();
    };
};

const checkPermission = (permissionName) => {
    return (req, res, next) => {
        // Super admins skip permission checks
        if (req.user && req.user.role === 'super-admin') {
            return next();
        }

        if (!req.user || !req.user.permissions || !req.user.permissions[permissionName]) {
            return res.status(403).json({ 
                message: `Permission Denied: You do not have the '${permissionName}' privilege.` 
            });
        }
        next();
    };
};

// Check for emergency Read-Only mode
const checkReadOnlyMode = async (req, res, next) => {
    if (req.user && req.user.id && req.user.role !== 'super-admin') {
        let readOnlyMode = req._readOnlyMode;
        if (readOnlyMode === undefined) {
            const owner = await prisma.owner.findUnique({
                where: { id: req.user.id },
                select: { readOnlyMode: true }
            });
            readOnlyMode = owner ? owner.readOnlyMode : false;
            req._readOnlyMode = readOnlyMode;
        }

        if (readOnlyMode) {
            const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
            if (isWrite) {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied: Your account is in Read-Only mode. Edit actions are blocked.'
                });
            }
        }
    }
    next();
};

// Check for boutique freeze or suspension
const checkBoutiqueStatus = async (req, res, next) => {
    if (req.user && req.user.role === 'super-admin') return next();

    const isRead = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (isRead && !req.user) return next();

    let boutiqueId = null;

    if (req.user && req.user.assignedBoutiqueId) {
        boutiqueId = req.user.assignedBoutiqueId;
    } else if (req.params.boutiqueId) {
        boutiqueId = req.params.boutiqueId;
    } else if (req.body.boutiqueId) {
        boutiqueId = req.body.boutiqueId;
    } else if (req.query.boutiqueId) {
        boutiqueId = req.query.boutiqueId;
    } else if (req.params.id && req.baseUrl && req.baseUrl.includes('boutiques')) {
        boutiqueId = req.params.id;
    }

    if (boutiqueId) {
        const cacheKey = `_boutiqueStatus_${boutiqueId}`;
        let boutique = req[cacheKey];

        if (!boutique) {
            boutique = await prisma.boutique.findUnique({
                where: { id: boutiqueId },
                select: { isSuspended: true, isFrozen: true }
            });
            req[cacheKey] = boutique;
        }

        if (boutique) {
            if (boutique.isSuspended) {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied: This boutique is suspended.'
                });
            }

            if (boutique.isFrozen && !isRead) {
                const urlPath = (req.baseUrl + req.path).toLowerCase();
                if (urlPath.includes('orders') || urlPath.includes('bookings') || urlPath.includes('reviews')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Action Denied: This boutique is currently frozen by administration. New orders, bookings, and reviews are blocked.'
                    });
                }
            }
        }
    }
    next();
};

// Check module level access control
const checkFeatureAccess = (featureName) => {
    return async (req, res, next) => {
        if (req.user && req.user.role === 'super-admin') {
            return next();
        }

        if (req.user && req.user.id) {
            if (!req._featurePermissions) {
                req._featurePermissions = await prisma.ownerFeaturePermission.findUnique({
                    where: { ownerId: req.user.id }
                });
            }

            let permissions = req._featurePermissions;

            if (!permissions) {
                permissions = {
                    canManageOrders: true,
                    canManageBookings: true,
                    canManageReviews: true,
                    canManagePayments: true,
                    canManagePayouts: true,
                    canManageGallery: true,
                    canManageDesigns: true,
                    canManageAnalytics: true,
                    canManageNotifications: true,
                    canManageStaff: true,
                    canManageCustomers: true,
                    canManageMeasurements: true,
                    canManageInventory: true,
                    canManageExpenses: true,
                    canManageProduction: true,
                    canManageDelivery: true,
                    canManageMarketing: true,
                    canManageRoles: true,
                    canManageBranches: true,
                    canExportReports: true
                };
            }

            const fieldMap = {
                'products': 'canManageProducts',
                'orders': 'canManageOrders',
                'bookings': 'canManageBookings',
                'reviews': 'canManageReviews',
                'payments': 'canManagePayments',
                'payouts': 'canManagePayouts',
                'analytics': 'canManageAnalytics',
                'gallery': 'canManageGallery',
                'designs': 'canManageDesigns',
                'staff': 'canManageStaff',
                'notifications': 'canManageNotifications',
                'customers': 'canManageCustomers',
                'measurements': 'canManageMeasurements',
                'inventory': 'canManageInventory',
                'expenses': 'canManageExpenses',
                'production': 'canManageProduction',
                'delivery': 'canManageDelivery',
                'marketing': 'canManageMarketing',
                'roles': 'canManageRoles',
                'branches': 'canManageBranches',
                'reports': 'canExportReports'
            };

            const permissionField = fieldMap[featureName];
            if (permissionField && permissions[permissionField] === false) {
                return res.status(403).json({
                    success: false,
                    message: `Access Denied: The '${featureName}' module is currently disabled for your account.`
                });
            }
        }
        next();
    };
};

module.exports = { 
    protect, 
    authorize, 
    checkPermission, 
    checkReadOnlyMode, 
    checkBoutiqueStatus, 
    checkFeatureAccess 
};
