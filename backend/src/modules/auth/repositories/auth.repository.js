const prisma = require('../../../utils/prisma');

class AuthRepository {
  async findOwnerByUsernameOrEmail(username) {
    return prisma.owner.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isDeleted: false
      }
    });
  }

  async updateOwnerLastLogin(id) {
    return prisma.owner.update({
      where: { id },
      data: { lastLogin: new Date() }
    });
  }

  async findOwnerByResetPasswordToken(hashedToken) {
    return prisma.owner.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() }
      }
    });
  }

  async updateOwnerPasswordAfterReset(id, hashedPassword) {
    return prisma.owner.update({
      where: { id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
        mustResetPassword: false
      }
    });
  }

  async findOwnerByInviteToken(hashedToken) {
    return prisma.owner.findFirst({
      where: {
        inviteTokenHash: hashedToken,
        inviteExpiresAt: { gt: new Date() }
      }
    });
  }

  async updateOwnerPasswordAfterInvite(id, hashedPassword) {
    return prisma.owner.update({
      where: { id },
      data: {
        password: hashedPassword,
        inviteTokenHash: null,
        inviteExpiresAt: null,
        status: 'Active',
        emailVerified: true,
        mustResetPassword: false
      }
    });
  }

  async findUserByPhone(phone) {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  async upsertUserOtp(phone, otp, otpExpiresAt, now) {
    return prisma.user.upsert({
      where: { phone },
      update: {
        otp,
        otpExpiresAt,
        otpGeneratedAt: now,
        otpRemainingAttempts: 5,
        otpMaxAttempts: 5,
        otpStatus: 'ACTIVE',
        otpVerifiedAt: null,
        otpUpdatedAt: now
      },
      create: {
        phone,
        otp,
        otpExpiresAt,
        otpGeneratedAt: now,
        otpRemainingAttempts: 5,
        otpMaxAttempts: 5,
        otpStatus: 'ACTIVE',
        otpVerifiedAt: null,
        otpUpdatedAt: now
      }
    });
  }

  async updateUserOtpStatus(id, status, now) {
    return prisma.user.update({
      where: { id },
      data: {
        otpStatus: status,
        otpUpdatedAt: now
      }
    });
  }

  async updateUserOtpAttempts(id, remainingAttempts, status, now) {
    return prisma.user.update({
      where: { id },
      data: {
        otpRemainingAttempts: remainingAttempts,
        otpStatus: status,
        otpUpdatedAt: now
      }
    });
  }

  async updateUserOtpVerified(id, now) {
    return prisma.user.update({
      where: { id },
      data: {
        otp: null,
        otpExpiresAt: null,
        otpStatus: 'VERIFIED',
        otpVerifiedAt: now,
        otpUpdatedAt: now
      }
    });
  }
}

module.exports = new AuthRepository();
