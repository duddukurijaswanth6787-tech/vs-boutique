import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { LoggerService } from '@common/logger/logger.service';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: any;
  let mockPassword: any;
  let mockJwt: any;
  let mockRefresh: any;
  let mockLogger: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$argon2id$hash',
    firstName: 'Test',
    lastName: 'User',
    userType: 'CUSTOMER',
    accountStatus: 'ACTIVE',
    loginAttempts: 0,
    lockoutUntil: null,
    userRoles: [{ role: { name: 'customer' } }],
  };

  beforeEach(async () => {
    mockRepo = {
      findByEmailBasic: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByIdBasic: jest
        .fn()
        .mockResolvedValue({ passwordHash: '$argon2id$hash' }),
      createUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        userType: 'CUSTOMER',
      }),
      findRoleByName: jest
        .fn()
        .mockResolvedValue({ id: 'role-1', name: 'customer' }),
      assignRole: jest.fn().mockResolvedValue(undefined),
      updateLoginAttempts: jest.fn().mockResolvedValue(undefined),
      resetLoginAttempts: jest.fn().mockResolvedValue(undefined),
      logLoginAttempt: jest.fn().mockResolvedValue(undefined),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };

    mockPassword = {
      hash: jest.fn().mockResolvedValue('$argon2id$newhash'),
      verify: jest.fn().mockResolvedValue(true),
    };

    mockJwt = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
      getExpiresIn: jest.fn().mockReturnValue(900),
    };

    mockRefresh = {
      create: jest.fn().mockResolvedValue('refresh-token-uuid'),
      validate: jest
        .fn()
        .mockResolvedValue({ userId: 'user-1', token: 'refresh-token-uuid' }),
      revoke: jest.fn().mockResolvedValue(undefined),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    mockLogger = { log: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: PasswordService, useValue: mockPassword },
        { provide: JwtService, useValue: mockJwt },
        { provide: RefreshTokenService, useValue: mockRefresh },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      const result = await service.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('refresh-token-uuid');
      expect(mockRepo.createUser).toHaveBeenCalled();
      expect(mockPassword.hash).toHaveBeenCalledWith('Password123!');
    });

    it('throws when email already exists', async () => {
      mockRepo.findByEmailBasic.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'Password123!',
          firstName: 'X',
        }),
      ).rejects.toThrow(BusinessException);
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('refresh-token-uuid');
      expect(mockRepo.resetLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('throws AuthenticationException for unknown email', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toThrow(AuthenticationException);
    });

    it('throws for wrong password and increments login attempts', async () => {
      mockPassword.verify.mockResolvedValue(false);
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(AuthenticationException);
      expect(mockRepo.updateLoginAttempts).toHaveBeenCalledWith(
        'user-1',
        1,
        null,
      );
    });

    it('locks account after MAX_LOGIN_ATTEMPTS failures', async () => {
      mockPassword.verify.mockResolvedValue(false);
      mockRepo.findByEmail.mockResolvedValue({
        ...mockUser,
        loginAttempts: IDENTITY_CONSTANTS.MAX_LOGIN_ATTEMPTS - 1,
      });
      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(AuthenticationException);
      expect(mockRepo.updateLoginAttempts).toHaveBeenCalledWith(
        'user-1',
        IDENTITY_CONSTANTS.MAX_LOGIN_ATTEMPTS,
        expect.any(Date),
      );
    });

    it('throws for locked account', async () => {
      mockRepo.findByEmail.mockResolvedValue({
        ...mockUser,
        accountStatus: 'LOCKED',
      });
      await expect(
        service.login({ email: 'test@example.com', password: 'x' }),
      ).rejects.toThrow(AuthenticationException);
    });

    it('throws when account is temporarily locked (lockoutUntil)', async () => {
      mockRepo.findByEmail.mockResolvedValue({
        ...mockUser,
        lockoutUntil: new Date(Date.now() + 60000),
      });
      await expect(
        service.login({ email: 'test@example.com', password: 'x' }),
      ).rejects.toThrow(AuthenticationException);
    });
  });

  describe('refresh', () => {
    it('returns new tokens for valid refresh token', async () => {
      const result = await service.refresh('refresh-token-uuid');
      expect(result).not.toBeNull();
      expect(result!.accessToken).toBe('jwt-token');
      expect(mockRefresh.revoke).toHaveBeenCalledWith('refresh-token-uuid');
    });

    it('returns null for invalid refresh token', async () => {
      mockRefresh.validate.mockResolvedValue(null);
      const result = await service.refresh('bad-token');
      expect(result).toBeNull();
    });

    it('returns null when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const result = await service.refresh('refresh-token-uuid');
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('revokes the refresh token', async () => {
      await service.logout('refresh-token-uuid');
      expect(mockRefresh.revoke).toHaveBeenCalledWith('refresh-token-uuid');
    });
  });

  describe('changePassword', () => {
    it('changes password and revokes all sessions', async () => {
      await service.changePassword('user-1', {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
      });
      expect(mockPassword.verify).toHaveBeenCalled();
      expect(mockPassword.hash).toHaveBeenCalledWith('NewPass1!');
      expect(mockRepo.updatePassword).toHaveBeenCalledWith(
        'user-1',
        '$argon2id$newhash',
      );
      expect(mockRefresh.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });

    it('throws for wrong current password', async () => {
      mockPassword.verify.mockResolvedValue(false);
      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toThrow(AuthenticationException);
    });
  });
});
