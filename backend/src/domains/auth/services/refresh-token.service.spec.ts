import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '@database/prisma.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(7) },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  describe('create', () => {
    it('creates a refresh token and returns the UUID', async () => {
      const token = await service.create('user-1', '127.0.0.1', 'Mozilla/5.0');
      expect(typeof token).toBe('string');
      expect(token.length).toBe(36); // UUID format
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            loginProvider: 'LOCAL',
          }),
        }),
      );
    });

    it('uses 30-day expiry for rememberMe', async () => {
      await service.create('user-1', undefined, undefined, true);
      const call = mockPrisma.refreshToken.create.mock.calls[0][0];
      const expiresAt = call.data.expiresAt;
      const diffDays = Math.round(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });
  });

  describe('validate', () => {
    it('returns the record for a valid, non-revoked, non-expired token', async () => {
      const record = {
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      const result = await service.validate('valid-token');
      expect(result).toEqual(record);
      expect(mockPrisma.refreshToken.update).toHaveBeenCalled(); // lastActivityAt update
    });

    it('returns null for non-existent token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      expect(await service.validate('bad-token')).toBeNull();
    });

    it('returns null for revoked token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        isRevoked: true,
        expiresAt: new Date(Date.now() + 60000),
      });
      expect(await service.validate('revoked-token')).toBeNull();
    });

    it('returns null for expired token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        isRevoked: false,
        expiresAt: new Date(Date.now() - 60000),
      });
      expect(await service.validate('expired-token')).toBeNull();
    });
  });

  describe('revoke', () => {
    it('marks the token as revoked', async () => {
      await service.revoke('token-to-revoke');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: 'token-to-revoke', isRevoked: false },
          data: expect.objectContaining({ isRevoked: true }),
        }),
      );
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes all non-revoked tokens for the user', async () => {
      await service.revokeAllForUser('user-1');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isRevoked: false },
        }),
      );
    });
  });

  describe('rotate', () => {
    it('validates, revokes old token, and creates new one', async () => {
      const record = {
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60000),
        ipAddress: '1.2.3.4',
        userAgent: 'UA',
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      const result = await service.rotate('old-token');
      expect(result).not.toBeNull();
      expect(result!.refreshToken).toBeDefined();
      expect(result!.refreshToken).not.toBe('old-token');
    });

    it('returns null for invalid token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      expect(await service.rotate('bad-token')).toBeNull();
    });
  });
});
