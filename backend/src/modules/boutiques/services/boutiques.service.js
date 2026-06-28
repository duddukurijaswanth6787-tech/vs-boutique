const bcrypt = require('bcrypt');
const crypto = require('crypto');
const boutiquesRepository = require('../repositories/boutiques.repository');
const { logAction } = require('../../../services/auditService');

// In-Memory Caching for Public Endpoints (60s TTL)
let publicBoutiquesCache = {
  data: null,
  timestamp: 0
};
const boutiqueDetailsCache = new Map();
const cacheTTL = 60 * 1000;

class BoutiquesService {
  parseExperienceYears(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return Math.floor(val);
    const parsed = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  parseStartingPrice(val) {
    if (val === null || val === undefined) return 0.00;
    if (typeof val === 'number') return val;
    const cleaned = val.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0.00 : parsed;
  }

  parseIntVal(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Math.floor(val);
    const parsed = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  parseDecimalVal(val) {
    if (val === null || val === undefined || val === '') return 0.00;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? 0.00 : parsed;
  }

  mapBoutiqueResponse(boutique, designs = []) {
    const obj = boutique;
    const media = {
      logo: obj.logoUrl || '',
      coverImage: obj.coverImageUrl || '',
      gallery: Array.isArray(obj.galleryUrls) ? obj.galleryUrls : []
    };

    return {
      id: obj.id,
      _id: obj.id,
      name: obj.name,
      description: obj.description || '',
      ownerName: obj.ownerName || '',
      experience: {
        years: Number(obj.experienceYears) || 0,
        label: `${obj.experienceYears || 0} Years Experience`
      },
      contact: {
        mobile: obj.mobileNumber || '',
        whatsapp: obj.whatsappNumber || '',
        email: obj.email || ''
      },
      location: {
        address: obj.fullAddress || '',
        city: obj.city || '',
        area: obj.area || '',
        state: obj.state || '',
        pincode: obj.pincode || '',
        googleMapsLink: obj.googleMapsLink || '',
        displayLocation: [obj.area, obj.city].filter(Boolean).join(', ')
      },
      stats: {
        rating: Number(obj.rating) || 0,
        reviewsCount: Number(obj.reviewsCount) || 0,
        happyClients: Number(obj.happyClients) || 0,
        totalDesigns: Number(obj.totalDesigns) || 0
      },
      features: {
        services: Array.isArray(obj.servicesOffered) ? obj.servicesOffered : [],
        specialties: Array.isArray(obj.workTypeSpecialty) ? obj.workTypeSpecialty : [],
        pickup: !!obj.pickupAvailable,
        delivery: !!obj.deliveryAvailable,
        homeVisit: !!obj.homeVisitAvailable,
        appointment: !!obj.appointmentBookingAvailable,
        rushOrder: !!obj.rushOrderAvailable
      },
      media,
      business: {
        status: obj.status || 'Active',
        isVerified: !!obj.verified,
        isFeatured: !!obj.featuredBoutique,
        startingPrice: Number(obj.startingPrice) || 0,
        turnaroundTime: obj.turnaroundTime || ''
      },
      designs: designs.map(d => ({
        id: d.id,
        _id: d.id,
        name: d.name,
        image: d.images[0] || '',
        price: Number(d.price) || 0,
        category: d.category || '',
        rating: 4.8
      }))
    };
  }

  async getPublicBoutiques() {
    const now = Date.now();
    if (publicBoutiquesCache.data && (now - publicBoutiquesCache.timestamp < cacheTTL)) {
      return { fromCache: true, data: publicBoutiquesCache.data };
    }

    const boutiques = await boutiquesRepository.findPublicBoutiques();
    const formattedBoutiques = boutiques.map(b => this.mapBoutiqueResponse(b));
    const jsonStr = JSON.stringify(formattedBoutiques);

    publicBoutiquesCache = {
      data: jsonStr,
      timestamp: Date.now()
    };

    return { fromCache: false, data: jsonStr };
  }

  async getPublicBoutiqueById(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw { status: 404, message: 'Boutique not found' };
    }

    const now = Date.now();
    if (boutiqueDetailsCache.has(id)) {
      const cached = boutiqueDetailsCache.get(id);
      if (now - cached.timestamp < cacheTTL) {
        return { fromCache: true, data: cached.data };
      }
    }

    const boutique = await boutiquesRepository.findPublicBoutiqueById(id);
    if (!boutique) {
      throw { status: 404, message: 'Boutique not found' };
    }

    const designs = boutique.designs || [];
    const responseData = this.mapBoutiqueResponse(boutique, designs);
    const jsonStr = JSON.stringify(responseData);

    boutiqueDetailsCache.set(id, {
      data: jsonStr,
      timestamp: Date.now()
    });

    return { fromCache: false, data: jsonStr };
  }

  async getAllBoutiques() {
    const boutiques = await boutiquesRepository.findAllBoutiques();
    return boutiques.map(b => ({
      ...b,
      id: b.id,
      _id: b.id,
      media: {
        logo: b.logoUrl || '',
        coverImage: b.coverImageUrl || '',
        gallery: Array.isArray(b.galleryUrls) ? b.galleryUrls : []
      }
    }));
  }

  async getBoutiqueDetails(id) {
    const boutique = await boutiquesRepository.findBoutiqueById(id);
    if (!boutique) {
      throw { status: 404, message: 'Boutique not found' };
    }

    const owners = await boutiquesRepository.findOwnersByBoutiqueId(id);
    owners.forEach(o => delete o.password);

    const boutiqueObj = {
      ...boutique,
      id: boutique.id,
      _id: boutique.id,
      media: {
        logo: boutique.logoUrl || '',
        coverImage: boutique.coverImageUrl || '',
        gallery: Array.isArray(boutique.galleryUrls) ? boutique.galleryUrls : []
      }
    };

    return {
      boutique: boutiqueObj,
      owner: owners[0] || null,
      owners: owners
    };
  }

  async createBoutique(body, creatorId) {
    const { ownerDetails, ...boutiqueData } = body;

    const requiredFields = [
      { field: 'name',          label: 'Boutique Name' },
      { field: 'ownerName',     label: 'Owner Name' },
      { field: 'email',         label: 'Email' },
      { field: 'mobileNumber',  label: 'Mobile Number' },
      { field: 'fullAddress',   label: 'Full Address' },
      { field: 'city',          label: 'City' },
      { field: 'state',         label: 'State' },
    ];
    
    const missingFields = requiredFields.filter(f => !boutiqueData[f.field]?.toString().trim());
    if (missingFields.length > 0) {
      throw { status: 400, message: `Missing required fields: ${missingFields.map(f => f.label).join(', ')}` };
    }

    let parsedOwnerDetails = null;

    if (ownerDetails && ownerDetails.username) {
      const existingOwner = await boutiquesRepository.checkDuplicateOwner(ownerDetails.username, ownerDetails.email || boutiqueData.email);
      if (existingOwner) {
        throw { status: 400, message: 'Duplicate value: a record with this username or email already exists.' };
      }

      let hashedPassword;
      let status = 'Active';
      let mustResetPassword = false;
      let emailVerified = false;

      if (ownerDetails.password) {
        hashedPassword = await bcrypt.hash(ownerDetails.password, 10);
        emailVerified = true;
      } else {
        const tempPassword = crypto.randomBytes(8).toString('hex');
        hashedPassword = await bcrypt.hash(tempPassword, 10);
        mustResetPassword = true;
        status = 'Pending';
      }

      parsedOwnerDetails = {
        username: ownerDetails.username,
        email: ownerDetails.email || boutiqueData.email,
        mobileNumber: ownerDetails.mobileNumber || boutiqueData.mobileNumber,
        password: hashedPassword,
        status,
        mustResetPassword,
        emailVerified
      };
    }

    const boutiqueInsertData = {
      name: boutiqueData.name,
      ownerName: boutiqueData.ownerName,
      description: boutiqueData.description || '',
      experienceYears: this.parseExperienceYears(boutiqueData.experienceYears),
      status: boutiqueData.status || 'Active',
      featuredBoutique: !!boutiqueData.featuredBoutique,
      verified: !!boutiqueData.verified,
      happyClients: this.parseIntVal(boutiqueData.happyClients),
      totalDesigns: this.parseIntVal(boutiqueData.totalDesigns),
      mobileNumber: boutiqueData.mobileNumber,
      whatsappNumber: boutiqueData.whatsappNumber || '',
      email: boutiqueData.email,
      fullAddress: boutiqueData.fullAddress,
      area: boutiqueData.area || '',
      city: boutiqueData.city,
      state: boutiqueData.state,
      pincode: boutiqueData.pincode || '',
      googleMapsLink: boutiqueData.googleMapsLink || '',
      serviceRadius: boutiqueData.serviceRadius || '',
      openDays: boutiqueData.openDays || '',
      openingTime: boutiqueData.openingTime || '',
      closingTime: boutiqueData.closingTime || '',
      weeklyHoliday: boutiqueData.weeklyHoliday || '',
      servicesOffered: boutiqueData.servicesOffered || [],
      workTypeSpecialty: boutiqueData.workTypeSpecialty || [],
      pickupAvailable: !!boutiqueData.pickupAvailable,
      deliveryAvailable: !!boutiqueData.deliveryAvailable,
      homeVisitAvailable: !!boutiqueData.homeVisitAvailable,
      appointmentBookingAvailable: !!boutiqueData.appointmentBookingAvailable,
      rushOrderAvailable: !!boutiqueData.rushOrderAvailable,
      startingPrice: this.parseStartingPrice(boutiqueData.startingPrice),
      turnaroundTime: boutiqueData.turnaroundTime || '',
      logoUrl: boutiqueData.media?.logo || '',
      coverImageUrl: boutiqueData.media?.coverImage || '',
      galleryUrls: boutiqueData.media?.gallery || [],
      instagramHandle: boutiqueData.instagramHandle || '',
      facebookPage: boutiqueData.facebookPage || '',
      websiteLink: boutiqueData.websiteLink || '',
      verificationDocuments: boutiqueData.verificationDocuments || [],
      payoutDetails: boutiqueData.payoutDetails || '',
      payoutStatus: boutiqueData.payoutStatus || 'Pending',
      internalNotes: boutiqueData.internalNotes || '',
      isDeleted: !!boutiqueData.isDeleted,
      deletedAt: boutiqueData.deletedAt ? new Date(boutiqueData.deletedAt) : null,
      rating: this.parseDecimalVal(boutiqueData.rating) || 0.00,
      reviewsCount: this.parseIntVal(boutiqueData.reviewsCount)
    };

    const result = await boutiquesRepository.createBoutiqueAndOwnerTransaction(boutiqueInsertData, parsedOwnerDetails);

    // Audit logs
    await logAction('CREATE_BOUTIQUE', 'Boutique', result.boutique.id, creatorId, { name: result.boutique.name });
    if (result.ownerId) {
      await logAction('CREATE_OWNER_DIRECT', 'Owner', result.ownerId, creatorId, { username: ownerDetails.username });
    }

    return {
      ...result.boutique,
      id: result.boutique.id,
      _id: result.boutique.id,
      media: {
        logo: result.boutique.logoUrl || '',
        coverImage: result.boutique.coverImageUrl || '',
        gallery: Array.isArray(result.boutique.galleryUrls) ? result.boutique.galleryUrls : []
      }
    };
  }

  async updateBoutique(id, body, user) {
    const { __v, ...updateData } = body;
    
    delete updateData.logo;
    delete updateData.coverImage;
    delete updateData.galleryImages;

    const boutique = await boutiquesRepository.findBoutiqueById(id);
    if (!boutique) {
      throw { status: 404, message: 'Boutique not found' };
    }

    if (typeof __v !== 'undefined' && boutique.version !== __v) {
      throw { status: 409, message: 'Conflict: Boutique has been updated by someone else. Please refresh.' };
    }

    if (user.role === 'owner' && user.assignedBoutiqueId !== id) {
      throw { status: 403, message: 'Not authorized' };
    }

    const prismaData = {
      ...updateData,
      experienceYears: updateData.experienceYears !== undefined ? this.parseExperienceYears(updateData.experienceYears) : undefined,
      startingPrice: updateData.startingPrice !== undefined ? this.parseStartingPrice(updateData.startingPrice) : undefined,
      happyClients: updateData.happyClients !== undefined ? this.parseIntVal(updateData.happyClients) : undefined,
      totalDesigns: updateData.totalDesigns !== undefined ? this.parseIntVal(updateData.totalDesigns) : undefined,
      rating: updateData.rating !== undefined ? this.parseDecimalVal(updateData.rating) : undefined,
      reviewsCount: updateData.reviewsCount !== undefined ? this.parseIntVal(updateData.reviewsCount) : undefined,
      version: boutique.version + 1
    };

    if (updateData.media) {
      if (updateData.media.logo !== undefined) prismaData.logoUrl = updateData.media.logo;
      if (updateData.media.coverImage !== undefined) prismaData.coverImageUrl = updateData.media.coverImage;
      if (updateData.media.gallery !== undefined) prismaData.galleryUrls = updateData.media.gallery;
      delete prismaData.media;
    }

    const updatedBoutique = await boutiquesRepository.updateBoutique(id, prismaData);

    const changes = Object.keys(updateData).filter(key => JSON.stringify(boutique[key]) !== JSON.stringify(updateData[key]));
    await logAction('UPDATE_BOUTIQUE', 'Boutique', updatedBoutique.id, user.id, { changes });

    // Invalidate details cache
    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache

    return {
      ...updatedBoutique,
      id: updatedBoutique.id,
      _id: updatedBoutique.id,
      media: {
        logo: updatedBoutique.logoUrl || '',
        coverImage: updatedBoutique.coverImageUrl || '',
        gallery: Array.isArray(updatedBoutique.galleryUrls) ? updatedBoutique.galleryUrls : []
      }
    };
  }

  async updateBoutiqueStatus(id, body, userId) {
    const { status, verified, featuredBoutique } = body;
    const boutique = await boutiquesRepository.findBoutiqueById(id);
    if (!boutique) throw { status: 404, message: 'Boutique not found' };

    const updated = await boutiquesRepository.updateBoutique(id, {
      status: status !== undefined ? status : undefined,
      verified: verified !== undefined ? !!verified : undefined,
      featuredBoutique: featuredBoutique !== undefined ? !!featuredBoutique : undefined
    });

    await logAction('UPDATE_BOUTIQUE_STATUS', 'Boutique', boutique.id, userId, body);

    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache

    return {
      ...updated,
      id: updated.id,
      _id: updated.id,
      media: {
        logo: updated.logoUrl || '',
        coverImage: updated.coverImageUrl || '',
        gallery: Array.isArray(updated.galleryUrls) ? updated.galleryUrls : []
      }
    };
  }

  async deleteBoutique(id, adminPassword, adminUserId) {
    if (!adminPassword) {
      throw { status: 400, message: 'Admin password is required to delete boutique' };
    }

    const adminUser = await boutiquesRepository.findOwnerById(adminUserId);
    if (!adminUser) {
      throw { status: 401, message: 'Admin account not found' };
    }

    const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid admin password' };
    }

    const boutique = await boutiquesRepository.findBoutiqueById(id);
    if (!boutique) {
      throw { status: 404, message: 'Boutique not found' };
    }

    await boutiquesRepository.softDeleteBoutiqueTransaction(id);

    await logAction('SOFT_DELETE_BOUTIQUE', 'Boutique', id, adminUserId, { name: boutique.name });

    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache
  }

  async verifyBoutique(id) {
    const updated = await boutiquesRepository.updateBoutique(id, { verified: true });
    
    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache

    return {
      ...updated,
      id: updated.id,
      _id: updated.id,
      media: {
        logo: updated.logoUrl || '',
        coverImage: updated.coverImageUrl || '',
        gallery: Array.isArray(updated.galleryUrls) ? updated.galleryUrls : []
      }
    };
  }

  async featureBoutique(id) {
    const updated = await boutiquesRepository.updateBoutique(id, { featuredBoutique: true });
    
    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache

    return {
      ...updated,
      id: updated.id,
      _id: updated.id,
      media: {
        logo: updated.logoUrl || '',
        coverImage: updated.coverImageUrl || '',
        gallery: Array.isArray(updated.galleryUrls) ? updated.galleryUrls : []
      }
    };
  }

  async activateBoutique(id) {
    const updated = await boutiquesRepository.updateBoutique(id, { status: 'Active' });
    
    boutiqueDetailsCache.delete(id);
    publicBoutiquesCache.data = null; // Invalidate list cache

    return {
      ...updated,
      id: updated.id,
      _id: updated.id,
      media: {
        logo: updated.logoUrl || '',
        coverImage: updated.coverImageUrl || '',
        gallery: Array.isArray(updated.galleryUrls) ? updated.galleryUrls : []
      }
    };
  }
}

module.exports = new BoutiquesService();
