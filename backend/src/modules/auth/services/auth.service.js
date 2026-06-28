const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const authRepository = require('../repositories/auth.repository');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const mapOwnerPermissions = (owner) => {
    return {
        canEditProfile: !!owner.canEditProfile,
        canEditServices: !!owner.canEditServices,
        canEditGallery: !!owner.canEditGallery,
        canManageDesigns: !!owner.canManageDesigns,
        canManageOrders: !!owner.canManageOrders,
        canManageBookings: !!owner.canManageBookings,
        canManageReviews: !!owner.canManageReviews,
        canManageMedia: !!owner.canManageMedia,
        canViewAnalytics: !!owner.canViewAnalytics,
        canManageCustomers: !!owner.canManageCustomers,
        canManageInventory: !!owner.canManageInventory,
        canManageMarketing: !!owner.canManageMarketing,
        canExportReports: !!owner.canExportReports
    };
};

class AuthService {
  async login(username, password) {
    if (!username || !password) {
      throw { status: 400, message: 'Username and password are required' };
    }

    const user = await authRepository.findOwnerByUsernameOrEmail(username);

    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    if (user.status !== 'Active') {
      const statusMsg = user.status === 'Pending' 
          ? 'Your account invitation is pending activation. Please check your email.' 
          : 'Account is blocked. Please contact support.';
      throw { status: 403, message: statusMsg };
    }

    if (user.loginEnabled === false) {
      throw { status: 403, message: 'Login is temporarily disabled for this account.' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    await authRepository.updateOwnerLastLogin(user.id);

    const permissions = mapOwnerPermissions(user);
    const resolvedRole = user.role === 'super_admin' ? 'super-admin' : user.role;

    const payload = {
        id: user.id,
        _id: user.id,
        role: resolvedRole,
        username: user.username,
        mustResetPassword: user.mustResetPassword,
        assignedBoutiqueId: user.assignedBoutiqueId,
        permissions
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    return {
      token,
      user: {
        id: user.id,
        _id: user.id,
        name: user.ownerName,
        username: user.username,
        role: resolvedRole,
        mustResetPassword: user.mustResetPassword,
        assignedBoutiqueId: user.assignedBoutiqueId,
        permissions
      }
    };
  }

  async resetPassword(token, password) {
    if (!password || !passwordRegex.test(password)) {
      throw {
        status: 400,
        message: 'Password must be at least 8 characters, include an uppercase letter, a number, and a special character.'
      };
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await authRepository.findOwnerByResetPasswordToken(hashedToken);

    if (!user) {
      throw { status: 400, message: 'Invalid or expired reset token' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await authRepository.updateOwnerPasswordAfterReset(user.id, hashedPassword);
    return { message: 'Password updated successfully. You can now login.' };
  }

  async sendOtp(phone) {
    if (!phone || phone.length !== 10) {
      throw { status: 400, message: 'Valid 10-digit phone number is required' };
    }

    const otp = generateOtp();
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    console.log(`[AUTH] OTP for ${phone}: ${otp}`);

    const user = await authRepository.upsertUserOtp(phone, otp, otpExpiresAt, now);

    const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV || process.env.NODE_ENV === "dev";
    const responseData = { message: 'OTP sent successfully' };
    
    if (isDev && process.env.NODE_ENV !== "production") {
      responseData.otp = otp;
      responseData.dev = {
        phone: user.phone,
        otp: otp,
        generatedAt: now.toISOString(),
        expiresAt: otpExpiresAt.toISOString(),
        expiresIn: 300,
        remainingAttempts: 5,
        maxAttempts: 5,
        status: 'ACTIVE'
      };
    }
    return responseData;
  }

  async verifyOtp(phone, otp) {
    if (!phone || !otp) {
      throw { status: 400, message: 'Phone and OTP are required' };
    }

    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw { status: 400, message: 'No account found with this phone number' };
    }

    const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV || process.env.NODE_ENV === "dev";
    const now = new Date();

    if (user.otpExpiresAt && now > user.otpExpiresAt) {
      await authRepository.updateUserOtpStatus(user.id, 'EXPIRED', now);
      const responseData = { message: 'OTP has expired. Please request a new one.' };
      if (isDev && process.env.NODE_ENV !== "production") {
        responseData.dev = {
          phone: user.phone,
          otp: user.otp || '------',
          generatedAt: user.otpGeneratedAt ? user.otpGeneratedAt.toISOString() : now.toISOString(),
          expiresAt: user.otpExpiresAt.toISOString(),
          expiresIn: 0,
          remainingAttempts: user.otpRemainingAttempts,
          maxAttempts: user.otpMaxAttempts,
          status: 'EXPIRED'
        };
      }
      throw { status: 401, responseData };
    }

    if (user.otpRemainingAttempts <= 0) {
      const responseData = { message: 'Maximum attempts reached. Please request a new OTP.' };
      if (isDev && process.env.NODE_ENV !== "production") {
        responseData.dev = {
          phone: user.phone,
          otp: user.otp || '------',
          generatedAt: user.otpGeneratedAt ? user.otpGeneratedAt.toISOString() : now.toISOString(),
          expiresAt: user.otpExpiresAt.toISOString(),
          expiresIn: Math.max(0, Math.round((user.otpExpiresAt.getTime() - now.getTime()) / 1000)),
          remainingAttempts: 0,
          maxAttempts: user.otpMaxAttempts,
          status: 'EXPIRED'
        };
      }
      throw { status: 401, responseData };
    }

    if (user.otp !== otp) {
      const newRemaining = Math.max(0, user.otpRemainingAttempts - 1);
      const status = newRemaining === 0 ? 'EXPIRED' : user.otpStatus;

      const updatedUser = await authRepository.updateUserOtpAttempts(user.id, newRemaining, status, now);

      const responseData = { message: 'Invalid OTP' };
      if (isDev && process.env.NODE_ENV !== "production") {
        responseData.dev = {
          phone: updatedUser.phone,
          otp: updatedUser.otp || '------',
          generatedAt: updatedUser.otpGeneratedAt ? updatedUser.otpGeneratedAt.toISOString() : now.toISOString(),
          expiresAt: updatedUser.otpExpiresAt.toISOString(),
          expiresIn: Math.max(0, Math.round((updatedUser.otpExpiresAt.getTime() - now.getTime()) / 1000)),
          remainingAttempts: updatedUser.otpRemainingAttempts,
          maxAttempts: updatedUser.otpMaxAttempts,
          status: updatedUser.otpStatus
        };
      }
      throw { status: 401, responseData };
    }

    if (user.status !== 'ACTIVE') {
      throw { status: 403, message: 'Account is blocked. Please contact support.' };
    }

    const verifiedUser = await authRepository.updateUserOtpVerified(user.id, now);

    const payload = {
      id: verifiedUser.id,
      role: 'customer',
      phone: verifiedUser.phone
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    return {
      message: 'Login successful',
      token,
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name || 'Customer',
        phone: verifiedUser.phone,
        role: 'customer'
      }
    };
  }

  async getDevOtpMetadata(phone) {
    const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV || process.env.NODE_ENV === "dev";
    if (!isDev || process.env.NODE_ENV === "production") {
      throw { status: 404, message: 'Not Found' };
    }

    const user = await authRepository.findUserByPhone(phone);
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const now = new Date();
    let status = user.otpStatus;

    if (status === 'ACTIVE' && user.otpExpiresAt && now > user.otpExpiresAt) {
      status = 'EXPIRED';
      await authRepository.updateUserOtpStatus(user.id, 'EXPIRED', now);
    }

    return {
      phone: user.phone,
      otp: user.otpStatus === 'VERIFIED' ? '------' : (user.otp || '------'),
      generatedAt: user.otpGeneratedAt ? user.otpGeneratedAt.toISOString() : now.toISOString(),
      expiresAt: user.otpExpiresAt ? user.otpExpiresAt.toISOString() : now.toISOString(),
      expiresIn: user.otpExpiresAt ? Math.max(0, Math.round((user.otpExpiresAt.getTime() - now.getTime()) / 1000)) : 0,
      remainingAttempts: user.otpRemainingAttempts,
      maxAttempts: user.otpMaxAttempts,
      status
    };
  }

  async setPassword(token, password) {
    if (!token || !password) {
      throw { status: 400, message: 'Token and password are required' };
    }

    if (!passwordRegex.test(password)) {
      throw {
        status: 400,
        message: 'Password must be at least 8 characters, include an uppercase letter, a number, and a special character.'
      };
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await authRepository.findOwnerByInviteToken(hashedToken);

    if (!user) {
      throw { status: 400, message: 'Invalid or expired invitation token' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await authRepository.updateOwnerPasswordAfterInvite(user.id, hashedPassword);
    return { message: 'Account activated successfully. You can now login.' };
  }
}

module.exports = new AuthService();
