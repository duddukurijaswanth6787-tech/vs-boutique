const crypto = require('crypto');
const bcrypt = require('bcrypt');
const ownersRepository = require('../repositories/owners.repository');
const { logAction } = require('../../../services/auditService');
const { sendPasswordResetEmail } = require('../../../services/emailService');
const { withSubscriptionGuard, getActiveSubscription } = require('../../../services/subscriptionService');

const mapOwnerResponse = (owner) => {
  if (!owner) return null;
  const mapped = {
    ...owner,
    id: owner.id,
    _id: owner.id,
    permissions: {
      canEditProfile: !!owner.canEditProfile,
      canEditServices: !!owner.canEditServices,
      canEditGallery: !!owner.canEditGallery,
      canManageDesigns: !!owner.canManageDesigns,
      canManageOrders: !!owner.canManageOrders,
      canManageBookings: !!owner.canManageBookings,
      canManageReviews: !!owner.canManageReviews,
      canManageMedia: !!owner.canManageMedia,
      canViewAnalytics: !!owner.canViewAnalytics
    }
  };
  delete mapped.password;
  return mapped;
};

const mapBoutiqueResponse = (boutique) => {
  if (!boutique) return null;
  return {
    ...boutique,
    id: boutique.id,
    _id: boutique.id,
    media: {
      logo: boutique.logoUrl || '',
      coverImage: boutique.coverImageUrl || '',
      gallery: Array.isArray(boutique.galleryUrls) ? boutique.galleryUrls : []
    }
  };
};

class OwnersService {
  async getUnassignedOwners() {
    const owners = await ownersRepository.findUnassignedOwners();
    return owners.map(mapOwnerResponse);
  }

  async inviteOwner(body, performedBy) {
    const { boutiqueId, ownerName, email, username, mobileNumber } = body;

    const boutique = await ownersRepository.findBoutiqueById(boutiqueId);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };
    if (boutique.ownerId) throw { status: 400, message: 'Boutique already has an owner' };

    const existingByEmail = await ownersRepository.findOwnerByEmailOrUsername(email, username);
    if (existingByEmail) {
      if (existingByEmail.status === 'Pending') {
        throw {
          status: 409,
          ownerId: existingByEmail.id,
          message: `An invitation for ${email} is already pending. You can resend the invite from the Owner tab instead of creating a new one.`
        };
      }
      throw { status: 400, message: 'A user with this email or username already exists and is active.' };
    }

    const inviteToken = crypto.randomBytes(20).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newOwner = await withSubscriptionGuard(boutiqueId, 'staff', async (tx) => {
      const owner = await tx.owner.create({
        data: {
          ownerName,
          email,
          username,
          mobileNumber: mobileNumber || '',
          password: hashedPassword,
          role: 'owner',
          status: 'Pending',
          assignedBoutiqueId: boutiqueId,
          inviteTokenHash,
          inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      await tx.boutique.update({
        where: { id: boutiqueId },
        data: { ownerId: owner.id }
      });

      return owner;
    });

    const inviteUrl = `http://10.10.1.25:5173/set-password?token=${inviteToken}`;
    await sendPasswordResetEmail(ownerName, email, inviteUrl);

    await logAction('INVITE_OWNER', 'Owner', newOwner.id, performedBy, { boutiqueId, email });

    return mapOwnerResponse(newOwner);
  }

  async linkOwner(body, performedBy) {
    const { boutiqueId, ownerId } = body;

    const boutique = await ownersRepository.findBoutiqueById(boutiqueId);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };

    const existingOwnerCount = await ownersRepository.countBoutiqueOwners(boutiqueId);
    if (existingOwnerCount >= 2) {
      throw { status: 400, message: 'This boutique already has the maximum of 2 owners. Unlink an existing owner first.' };
    }

    const owner = await ownersRepository.findOwnerById(ownerId);
    if (!owner || owner.isDeleted) throw { status: 404, message: 'Owner not found' };
    if (owner.assignedBoutiqueId) throw { status: 400, message: 'This owner is already assigned to another boutique.' };

    const updatedOwner = await ownersRepository.updateOwner(ownerId, {
      assignedBoutiqueId: boutiqueId,
      status: 'Active'
    });

    if (!boutique.ownerId) {
      await ownersRepository.updateBoutique(boutiqueId, { ownerId });
    }

    await logAction('LINK_OWNER', 'Owner', owner.id, performedBy, { boutiqueId });

    return { message: 'Owner linked successfully', owner: mapOwnerResponse(updatedOwner) };
  }

  async unlinkOwner(body, performedBy) {
    const { boutiqueId, ownerId } = body;
    await ownersRepository.unlinkOwnerTransaction(ownerId, boutiqueId);
    await logAction('UNLINK_OWNER', 'Owner', ownerId, performedBy, { boutiqueId });
    return { message: 'Owner unlinked successfully' };
  }

  async resendInvite(id) {
    const owner = await ownersRepository.findOwnerById(id);
    if (!owner || owner.status !== 'Pending') {
      throw { status: 400, message: 'Invitation cannot be resent (user already active or not found)' };
    }

    const inviteToken = crypto.randomBytes(20).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');

    await ownersRepository.updateOwner(id, {
      inviteTokenHash,
      inviteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const inviteUrl = `http://10.10.1.25:5173/set-password?token=${inviteToken}`;
    await sendPasswordResetEmail(owner.ownerName, owner.email, inviteUrl);

    return { message: 'Invitation email resent' };
  }

  async updateOwnerStatus(id, status, performedBy) {
    const owner = await ownersRepository.findOwnerById(id);
    if (!owner) throw { status: 404, message: 'Owner not found' };

    await ownersRepository.updateOwner(id, { status });
    await logAction('OWNER_STATUS_CHANGE', 'Owner', owner.id, performedBy, { status });

    return { message: `Owner status updated to ${status}`, status };
  }

  async sendResetLink(id, performedBy) {
    const owner = await ownersRepository.findOwnerById(id);
    if (!owner) throw { status: 404, message: 'Owner not found' };

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await ownersRepository.updateOwner(id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    const resetUrl = `http://10.10.1.25:5173/reset-password/${resetToken}`;
    await sendPasswordResetEmail(owner.ownerName, owner.email, resetUrl);
    await logAction('PASSWORD_RESET_SENT', 'Owner', owner.id, performedBy);

    return { message: 'Reset link sent to owner' };
  }

  async updateOwnerPermissions(id, permissions, performedBy) {
    const updated = await ownersRepository.updateOwner(id, {
      canEditProfile: permissions.canEditProfile !== undefined ? !!permissions.canEditProfile : undefined,
      canEditServices: permissions.canEditServices !== undefined ? !!permissions.canEditServices : undefined,
      canEditGallery: permissions.canEditGallery !== undefined ? !!permissions.canEditGallery : undefined,
      canManageDesigns: permissions.canManageDesigns !== undefined ? !!permissions.canManageDesigns : undefined,
      canManageOrders: permissions.canManageOrders !== undefined ? !!permissions.canManageOrders : undefined,
      canManageBookings: permissions.canManageBookings !== undefined ? !!permissions.canManageBookings : undefined,
      canManageReviews: permissions.canManageReviews !== undefined ? !!permissions.canManageReviews : undefined,
      canManageMedia: permissions.canManageMedia !== undefined ? !!permissions.canManageMedia : undefined,
      canViewAnalytics: permissions.canViewAnalytics !== undefined ? !!permissions.canViewAnalytics : undefined
    });

    await logAction('UPDATE_OWNER_PERMISSIONS', 'Owner', updated.id, performedBy, { permissions });

    return { message: 'Permissions updated successfully', owner: mapOwnerResponse(updated) };
  }

  async blockOwner(id) {
    const updated = await ownersRepository.updateOwner(id, { status: 'Blocked' });
    return mapOwnerResponse(updated);
  }

  async unblockOwner(id) {
    const updated = await ownersRepository.updateOwner(id, { status: 'Active' });
    return mapOwnerResponse(updated);
  }

  async getMe(id) {
    const owner = await ownersRepository.findOwnerById(id);
    if (!owner) throw { status: 404, message: 'Owner not found' };
    return mapOwnerResponse(owner);
  }

  async getDashboard(boutiqueId) {
    if (!boutiqueId) throw { status: 400, message: 'No boutique assigned' };

    const stats = await ownersRepository.getDashboardStats(boutiqueId);

    const recentOrdersMapped = stats.recentOrders.map(o => ({
      ...o,
      _id: o.id
    }));

    return {
      stats: {
        totalOrders: stats.totalOrders,
        totalBookings: stats.totalBookings,
        totalDesigns: stats.totalDesigns,
        totalCustomers: 0
      },
      recentOrders: recentOrdersMapped,
      boutique: mapBoutiqueResponse(stats.boutique)
    };
  }

  async getBoutique(boutiqueId) {
    const boutique = await ownersRepository.findBoutiqueById(boutiqueId);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };
    return mapBoutiqueResponse(boutique);
  }

  async updateBoutiqueInfo(boutiqueId, body, performedBy) {
    const { status, verified, featuredBoutique, ownerId, ...allowedUpdates } = body;

    const parseExperienceYears = (val) => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return Math.floor(val);
      const parsed = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseStartingPrice = (val) => {
      if (val === null || val === undefined) return 0.00;
      if (typeof val === 'number') return val;
      const cleaned = val.toString().replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0.00 : parsed;
    };

    const prismaData = {
      ...allowedUpdates,
      experienceYears: allowedUpdates.experienceYears !== undefined ? parseExperienceYears(allowedUpdates.experienceYears) : undefined,
      startingPrice: allowedUpdates.startingPrice !== undefined ? parseStartingPrice(allowedUpdates.startingPrice) : undefined
    };

    if (allowedUpdates.media) {
      if (allowedUpdates.media.logo !== undefined) prismaData.logoUrl = allowedUpdates.media.logo;
      if (allowedUpdates.media.coverImage !== undefined) prismaData.coverImageUrl = allowedUpdates.media.coverImage;
      if (allowedUpdates.media.gallery !== undefined) prismaData.galleryUrls = allowedUpdates.media.gallery;
      delete prismaData.media;
    }

    const forbiddenKeys = [
      'id', '_id', 'createdAt', 'updatedAt', 'ownerId', 'version', '__v',
      'commissionRate', 'walletBalance', 'pendingPayout', 'totalPaidOut',
      'isFrozen', 'isSuspended', 'subscriptionEnforcement', 'rating', 'reviewsCount',
      'status', 'verified', 'featuredBoutique', 'responseTimeAvg',
      'owners', 'primaryOwner', 'designs', 'orders', 'bookings',
      'notifications', 'payments', 'reviews', 'supportTickets', 'payouts',
      'subscriptions', 'customPlanRequests'
    ];

    forbiddenKeys.forEach(key => {
      delete prismaData[key];
    });

    const updatedBoutique = await ownersRepository.updateBoutique(boutiqueId, prismaData);

    await logAction('OWNER_UPDATE_BOUTIQUE', 'Boutique', boutiqueId, performedBy);

    return mapBoutiqueResponse(updatedBoutique);
  }

  async updateServices(boutiqueId, body, performedBy) {
    const { servicesOffered, workTypeSpecialty } = body;

    const boutique = await ownersRepository.updateBoutique(boutiqueId, {
      servicesOffered: servicesOffered || [],
      workTypeSpecialty: workTypeSpecialty || []
    });

    await logAction('OWNER_UPDATE_SERVICES', 'Boutique', boutiqueId, performedBy);
    return mapBoutiqueResponse(boutique);
  }

  async updateGallery(boutiqueId, body, performedBy) {
    const { galleryImages } = body;
    const gallery = Array.isArray(galleryImages) ? galleryImages : [];

    const sub = await getActiveSubscription(boutiqueId);
    if (sub && sub.plan && gallery.length > sub.plan.maxGalleryImages) {
      throw { status: 400, message: `Gallery image limit reached. Max limit is ${sub.plan.maxGalleryImages}.` };
    }

    const boutique = await withSubscriptionGuard(boutiqueId, 'gallery', async (tx) => {
      return await tx.boutique.update({
        where: { id: boutiqueId },
        data: {
          galleryUrls: gallery
        }
      });
    });

    await logAction('OWNER_UPDATE_GALLERY', 'Boutique', boutiqueId, performedBy);
    return mapBoutiqueResponse(boutique);
  }

  async updateMedia(boutiqueId, body, performedBy) {
    const { logo, coverImage } = body;

    const updateFields = {};
    if (logo !== undefined) updateFields.logoUrl = logo;
    if (coverImage !== undefined) updateFields.coverImageUrl = coverImage;

    if (Object.keys(updateFields).length === 0) {
      throw { status: 400, message: 'No media fields provided' };
    }

    const boutique = await ownersRepository.updateBoutique(boutiqueId, updateFields);

    await logAction('OWNER_UPDATE_MEDIA', 'Boutique', boutiqueId, performedBy, { fields: Object.keys(updateFields) });
    return mapBoutiqueResponse(boutique).media;
  }

  async getStaff(boutiqueId) {
    if (!boutiqueId) throw { status: 400, message: 'Owner has no assigned boutique' };
    const staff = await ownersRepository.findStaffByBoutiqueId(boutiqueId);
    return staff.map(mapOwnerResponse);
  }

  async changePassword(userId, body, performedBy) {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw { status: 400, message: 'Current password and new password are required' };
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw {
        status: 400,
        message: 'Password must be at least 8 characters, include an uppercase letter, a number, and a special character.'
      };
    }

    const owner = await ownersRepository.findOwnerById(userId);
    if (!owner) throw { status: 404, message: 'Owner not found' };

    const isMatch = await bcrypt.compare(currentPassword, owner.password);
    if (!isMatch) throw { status: 400, message: 'Incorrect current password' };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await ownersRepository.updateOwner(userId, {
      password: hashedPassword,
      mustResetPassword: false
    });

    await logAction('OWNER_CHANGE_PASSWORD', 'Owner', userId, performedBy);
    return { success: true, message: 'Password changed successfully' };
  }
}

module.exports = new OwnersService();
