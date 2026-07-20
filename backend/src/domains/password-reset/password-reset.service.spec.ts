import { Test, TestingModule } from '@nestjs/testing';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '@database/prisma.service';
import { PasswordService } from '@domains/auth/services/password.service';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { BusinessException } from '@common/exceptions';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let mockPrisma: any;
  let mockPassword: any;
  let mockAudit: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockPrisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      passwordResetToken: {
        updateMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
    };

    mockPassword = { hash: jest.fn().mockResolvedValue('$argon2id$newhash') };
    mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
    mockLogger = { log: jest.fn(), warn: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PasswordService, useValue: mockPassword },
        { provide: AuditService, useValue: mockAudit },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  describe('forgot', () => {
    it('returns generic message for unknown email (no enumeration)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.forgot('nobody@example.com');
      expect(result.message).toContain('If an account with that email exists');
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('creates reset token for known email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      const result = await service.forgot('test@example.com');
      expect(result.message).toContain('If an account with that email exists');
      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalled(); // invalidates old tokens
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('returns resetToken in non-production', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });
      const result = await service.forgot('test@example.com');
      expect(result).toHaveProperty('resetToken');
    });
  });

  describe('reset', () => {
    const validRecord = {
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    };

    it('resets password with valid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validRecord);
      const result = await service.reset('valid-token', 'NewPass1!');
      expect(result.message).toContain('successful');
      expect(mockPassword.hash).toHaveBeenCalledWith('NewPass1!');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled(); // revokes all sessions
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_COMPLETED' }),
      );
    });

    it('throws for non-existent token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(service.reset('bad-token', 'NewPass1!')).rejects.toThrow(
        BusinessException,
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_TOKEN_INVALID' }),
      );
    });

    it('throws for already-used token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validRecord,
        usedAt: new Date(),
      });
      await expect(service.reset('used-token', 'NewPass1!')).rejects.toThrow(
        BusinessException,
      );
    });

    it('throws for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validRecord,
        expiresAt: new Date(Date.now() - 60000),
      });
      await expect(service.reset('expired-token', 'NewPass1!')).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('validateToken', () => {
    it('returns valid: true for a valid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        usedAt: null,
        expiresAt: new Date(Date.now() + 60000),
      });
      const result = await service.validateToken('valid-token');
      expect(result.valid).toBe(true);
    });

    it('returns valid: false for non-existent token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);
      const result = await service.validateToken('bad-token');
      expect(result.valid).toBe(false);
      expect(mockAudit.log).toHaveBeenCalled();
    });

    it('returns valid: false for used token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
      });
      const result = await service.validateToken('used-token');
      expect(result.valid).toBe(false);
    });

    it('returns valid: false for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        usedAt: null,
        expiresAt: new Date(Date.now() - 60000),
      });
      const result = await service.validateToken('expired-token');
      expect(result.valid).toBe(false);
    });
  });
});
