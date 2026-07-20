import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './services/password.service';
import { JwtService, JwtPayload } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  AuthTokensResponse,
  MeResponse,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly loggerService: LoggerService,
  ) {}

  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponse> {
    // ponytail: lightweight email check — no roles/permissions needed
    const existing = await this.authRepository.findByEmailBasic(dto.email);
    if (existing) {
      throw new BusinessException('Email already registered', 'AUTH_003');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.authRepository.createUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    const role = await this.authRepository.findRoleByName(
      IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE,
    );
    if (role) {
      await this.authRepository.assignRole(user.id, role.id);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      roles: [IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE],
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.refreshTokenService.create(
      user.id,
      ip,
      userAgent,
    );

    this.loggerService.log(
      { action: 'register', userId: user.id },
      'AuthService',
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtService.getExpiresIn(),
    };
  }

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponse> {
    const user = await this.authRepository.findByEmail(dto.email);
    if (!user) {
      throw new AuthenticationException('Invalid credentials', 'AUTH_001');
    }

    if (user.deletedAt) {
      throw new AuthenticationException('Account has been deleted', 'AUTH_006');
    }

    if (user.accountStatus === 'LOCKED' || user.accountStatus === 'SUSPENDED') {
      await this.authRepository.logLoginAttempt({
        email: dto.email, userId: user.id, ipAddress: ip, userAgent, success: false, failureReason: 'ACCOUNT_LOCKED',
      });
      throw new AuthenticationException(
        'Account is locked or suspended',
        'AUTH_004',
      );
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      await this.authRepository.logLoginAttempt({
        email: dto.email, userId: user.id, ipAddress: ip, userAgent, success: false, failureReason: 'TEMP_LOCKOUT', lockoutUntil: user.lockoutUntil,
      });
      throw new AuthenticationException(
        'Account is temporarily locked. Try again later.',
        'AUTH_005',
      );
    }

    const valid = await this.passwordService.verify(
      user.passwordHash,
      dto.password,
    );
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const maxAttempts = IDENTITY_CONSTANTS.MAX_LOGIN_ATTEMPTS;
      let lockoutUntil: Date | null = null;
      if (attempts >= maxAttempts) {
        lockoutUntil = new Date(
          Date.now() + IDENTITY_CONSTANTS.LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
      }
      await this.authRepository.updateLoginAttempts(
        user.id,
        attempts,
        lockoutUntil,
      );
      this.loggerService.warn(
        { action: 'login_failed', userId: user.id, attempts },
        'AuthService',
      );
      await this.authRepository.logLoginAttempt({
        email: dto.email, userId: user.id, ipAddress: ip, userAgent, success: false, failureReason: 'INVALID_PASSWORD',
      });
      throw new AuthenticationException('Invalid credentials', 'AUTH_001');
    }

    await this.authRepository.resetLoginAttempts(user.id);

    const roles = user.userRoles.map((ur) => ur.role.name);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      roles,
    };
    const rememberMe = dto.rememberMe ?? false;
    const accessToken = this.jwtService.sign(payload, rememberMe);
    const refreshToken = await this.refreshTokenService.create(
      user.id,
      ip,
      userAgent,
      rememberMe,
    );

    this.loggerService.log({ action: 'login', userId: user.id }, 'AuthService');
    await this.authRepository.logLoginAttempt({
      email: dto.email, userId: user.id, ipAddress: ip, userAgent, success: true,
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtService.getExpiresIn(rememberMe),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revoke(refreshToken);
    this.loggerService.log({ action: 'logout' }, 'AuthService');
  }

  async refresh(
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokensResponse | null> {
    const record = await this.refreshTokenService.validate(refreshToken);
    if (!record) return null;

    const user = await this.authRepository.findById(record.userId);
    if (!user) return null;

    await this.refreshTokenService.revoke(refreshToken);

    const roles = user.userRoles.map((ur) => ur.role.name);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      roles,
    };
    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.refreshTokenService.create(
      user.id,
      ip,
      userAgent,
    );

    this.loggerService.log(
      { action: 'refresh', userId: user.id },
      'AuthService',
    );
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getExpiresIn(),
    };
  }

  async me(userId: string): Promise<MeResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new AuthenticationException('User not found', 'AUTH_001');

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ];
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      userType: user.userType,
      accountStatus: user.accountStatus,
      roles,
      permissions,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    // ponytail: only need passwordHash + existence
    const user = await this.authRepository.findByIdBasic(userId);
    if (!user) throw new AuthenticationException('User not found', 'AUTH_001');

    const valid = await this.passwordService.verify(
      user.passwordHash,
      dto.currentPassword,
    );
    if (!valid)
      throw new AuthenticationException(
        'Current password is incorrect',
        'AUTH_001',
      );

    const passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.authRepository.updatePassword(userId, passwordHash);
    await this.refreshTokenService.revokeAllForUser(userId);

    this.loggerService.log(
      { action: 'change_password', userId },
      'AuthService',
    );
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }
}
