const dayjs = require('dayjs');
const chalk = require('chalk');
const jwt = require('jsonwebtoken');

// Formatter helper
const getTimestamp = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

let activeRequestsCount = 0;

// CPU usage helpers
let startCpu = process.cpuUsage();
let startHrTime = process.hrtime();

function getCpuUsage() {
    const elapCpu = process.cpuUsage(startCpu);
    const elapTime = process.hrtime(startHrTime);
    
    const elapTimeMS = elapTime[0] * 1000 + elapTime[1] / 1000000;
    const elapCpuMS = (elapCpu.user + elapCpu.system) / 1000;
    
    const cpuPercent = elapTimeMS > 0 ? (elapCpuMS / elapTimeMS) * 100 : 0;
    
    startCpu = process.cpuUsage();
    startHrTime = process.hrtime();
    
    return Math.min(Math.round(cpuPercent), 100);
}

// System Health Monitor Logger
async function logSystemHealth(prisma) {
    try {
        const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const cpuPercent = getCpuUsage();
        
        let dbStatus = 'DISCONNECTED';
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbStatus = 'CONNECTED';
        } catch (e) {
            // connection issue
        }

        console.log(chalk.gray('\n┌────────────────────────────────────────┐'));
        console.log(chalk.bold.gray('📊 SYSTEM HEALTH'));
        console.log(chalk.gray('Memory:          ') + chalk.white(`${memoryMB} MB`));
        console.log(chalk.gray('CPU:             ') + chalk.white(`${cpuPercent}%`));
        console.log(chalk.gray('Database:        ') + (dbStatus === 'CONNECTED' ? chalk.green(dbStatus) : chalk.red(dbStatus)));
        console.log(chalk.gray('Active Requests: ') + chalk.white(activeRequestsCount));
        console.log(chalk.gray('└────────────────────────────────────────┘\n'));
    } catch (err) {
        console.error('System Health Logger Error:', err);
    }
}

// Request and Response Timing Middleware
const requestLogger = (req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
        activeRequestsCount++;
    }
    const start = Date.now();
    const timestamp = getTimestamp();

    const originalJson = res.json;
    let resBody = null;
    res.json = function (obj) {
        resBody = obj;
        return originalJson.apply(res, arguments);
    };

    let responseSize = 0;
    const oldWrite = res.write;
    const oldEnd = res.end;
    const chunks = [];

    res.write = function (chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        return oldWrite.apply(res, arguments);
    };

    res.end = function (chunk) {
        if (chunk) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks);
        responseSize = body.length;
        return oldEnd.apply(res, arguments);
    };

    if (!isProduction) {
        let userRole = 'ANONYMOUS';
        let username = 'Guest';
        if (req.user) {
            userRole = (req.user.role || 'Unknown').toUpperCase();
            username = req.user.username || req.user.ownerName || req.user.name || 'User';
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.decode(token);
                if (decoded) {
                    userRole = (decoded.role || 'Unknown').toUpperCase();
                    username = decoded.username || decoded.ownerName || decoded.name || 'User';
                }
            } catch (e) { console.error('[Logger] JWT decode error:', e); }
        }

        console.log(chalk.blue(`[${timestamp}] ${req.method} ${req.originalUrl} [${userRole}:${username}]`));

        if (req.body && Object.keys(req.body).length > 0) {
            const loggedBody = { ...req.body };
            if (loggedBody.password) loggedBody.password = '********';
            console.log(chalk.blue(`Body: `) + chalk.white(JSON.stringify(loggedBody)));
        }

        if (req.params && Object.keys(req.params).length > 0) {
            console.log(chalk.blue(`Params: `) + chalk.white(JSON.stringify(req.params)));
        }
        if (req.query && Object.keys(req.query).length > 0) {
            console.log(chalk.blue(`Query: `) + chalk.white(JSON.stringify(req.query)));
        }
    }

    res.on('finish', () => {
        if (!isProduction) {
            activeRequestsCount = Math.max(0, activeRequestsCount - 1);
        }
        const duration = Date.now() - start;

        if (isProduction) {
            const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
            console.log(JSON.stringify({
                level,
                timestamp,
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration,
                size: responseSize
            }));
            return;
        }

        let sizeStr = `${responseSize} B`;
        if (responseSize >= 1048576) {
            sizeStr = `${(responseSize / 1048576).toFixed(2)} MB`;
        } else if (responseSize >= 1024) {
            sizeStr = `${(responseSize / 1024).toFixed(2)} KB`;
        }

        let statusColor = chalk.green;
        if (res.statusCode >= 500) statusColor = chalk.red;
        else if (res.statusCode >= 400) statusColor = chalk.yellow;
        else if (res.statusCode >= 300) statusColor = chalk.cyan;

        console.log(statusColor(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ${sizeStr}`));

        if (duration > 1000) {
            console.log(chalk.yellow(`SLOW REQUEST: ${req.originalUrl} ${duration}ms`));
        }

        const isLoginRoute = req.originalUrl === '/auth/login' && req.method === 'POST';
        if (isLoginRoute) {
            if (res.statusCode === 200) {
                console.log(chalk.magenta(`LOGIN SUCCESS: ${req.body.username} (${resBody?.user?.role || 'Unknown'})`));
            } else {
                console.log(chalk.magenta(`LOGIN FAILED: ${req.body.username || 'unknown'} - ${resBody?.message || 'Invalid credentials'}`));
            }
        }

        if (res.statusCode >= 400) {
            console.log(chalk.red(`ERROR ${res.statusCode}: ${req.method} ${req.originalUrl} - ${resBody?.message || 'Internal Error'}`));
        }
    });

    next();
};

// Global error handler middleware
const errorLogger = (err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = getTimestamp();

    if (isProduction) {
        console.error(JSON.stringify({
            level: 'ERROR',
            timestamp,
            message: err.message,
            stack: err.stack,
            route: req.originalUrl,
            method: req.method
        }));
    } else {
        console.error(chalk.red(`\n❌ ERROR`));
        console.error(chalk.red(`Time:   `) + chalk.white(timestamp));
        console.error(chalk.red(`Route:  `) + chalk.white(req.originalUrl));
        console.error(chalk.red(`Method: `) + chalk.white(req.method));
        console.error(chalk.red(`Status: `) + chalk.white(err.statusCode || 500));
        console.error(chalk.red(`\nMessage:\n${err.message}`));
        if (err.stack) {
            console.error(chalk.red(`\nStack:\n${err.stack}`));
        }
        console.error(chalk.red('----------------------------------------\n'));
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: isProduction ? 'Internal server error' : err.message,
        ...(err.errors && { errors: err.errors })
    });
};

// Dynamic routes mapper
function getRoutes(app) {
    const routes = [];
    function print(path, layer) {
        if (layer.route) {
            layer.route.stack.forEach((stackLayer) => {
                const method = stackLayer.method ? stackLayer.method.toUpperCase() : 'ALL';
                const fullPath = path + layer.route.path;
                routes.push({ method, path: fullPath });
            });
        } else if (layer.name === 'router' && layer.handle.stack) {
            let routerPath = '';
            const match = layer.regexp.toString().match(/^\/\^\\(\/\w+)\\\/\?\(\?\=\\\/\|\$\)/);
            if (match) {
                routerPath = match[1];
            }
            layer.handle.stack.forEach((stackLayer) => {
                print(routerPath, stackLayer);
            });
        }
    }
    if (app._router && app._router.stack) {
        app._router.stack.forEach((layer) => {
            print('', layer);
        });
    }
    return routes;
}

// Server Startup Banner log helper
function logServerStartup(app, port) {
    const env = process.env.NODE_ENV || 'Development';
    const timestamp = getTimestamp();
    
    console.log(chalk.blue('\n================================================='));
    console.log(chalk.bold.blue('          VS BOUTIQUE BACKEND          '));
    console.log(chalk.blue('-------------------------------------------------'));
    console.log(chalk.blue(`Environment: `) + chalk.white(env));
    console.log(chalk.blue(`Port:        `) + chalk.white(port));
    console.log(chalk.blue(`Database:    `) + chalk.white('PostgreSQL'));
    console.log(chalk.blue(`Status:      `) + chalk.green('Connected'));
    console.log(chalk.blue(`Prisma:      `) + chalk.green('Connected'));
    console.log(chalk.blue(`Time:        `) + chalk.white(timestamp));
    console.log(chalk.blue('================================================='));
    
    console.log(chalk.blue('Available Routes:'));
    try {
        const routes = getRoutes(app);
        const seen = new Set();
        routes.forEach((r) => {
            const key = `${r.method} ${r.path}`;
            if (!seen.has(key)) {
                seen.add(key);
                console.log(
                    chalk.yellow(r.method.padEnd(6)) + ' ' + chalk.white(r.path)
                );
            }
        });
    } catch (e) {
        console.log(chalk.red('Error listing routes:', e.message));
    }
    console.log(chalk.blue('=================================================\n'));
}

// Register query listener for Prisma
function registerPrismaLogger(prismaClient) {
    prismaClient.$on('query', (e) => {
        const query = e.query;
        const duration = e.duration;
        
        let model = 'Unknown';
        let action = 'Query';
        
        const tableMatch = query.match(/(?:FROM|INSERT INTO|UPDATE|DELETE FROM)\s+(?:"public"\.)?"([A-Za-z_]+)"/i);
        if (tableMatch) {
            const rawTable = tableMatch[1];
            model = rawTable
                .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
                .replace(/s$/, '');
            if (model.toLowerCase() === 'auditlog') model = 'AuditLog';
            else if (model.toLowerCase() === 'orderhistorie') model = 'OrderHistory';
            else if (model.toLowerCase() === 'activitie') model = 'Activity';
            model = model.charAt(0).toUpperCase() + model.slice(1);
        }
        
        if (query.startsWith('SELECT')) action = 'Find';
        else if (query.startsWith('INSERT')) action = 'Create';
        else if (query.startsWith('UPDATE')) action = 'Update';
        else if (query.startsWith('DELETE')) action = 'Delete';
        else if (query.startsWith('BEGIN') || query.startsWith('COMMIT')) return;
        
        console.log(chalk.cyan(`\n🗄️ DATABASE`));
        console.log(chalk.cyan(`Model:    `) + chalk.white(model));
        console.log(chalk.cyan(`Action:   `) + chalk.white(action));
        console.log(chalk.cyan(`Duration: `) + chalk.white(`${duration}ms`));
        console.log(chalk.cyan(`Query:    `) + chalk.gray(`${query}\n`));
    });
}

// Start health timer
function startSystemHealthMonitor(prisma) {
    const isProduction = process.env.NODE_ENV === 'production';
    setInterval(() => {
        if (isProduction) {
            logSystemHealth(prisma).then(() => {}).catch(() => {});
        } else {
            logSystemHealth(prisma);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

module.exports = {
    requestLogger,
    errorLogger,
    logServerStartup,
    registerPrismaLogger,
    startSystemHealthMonitor
};
