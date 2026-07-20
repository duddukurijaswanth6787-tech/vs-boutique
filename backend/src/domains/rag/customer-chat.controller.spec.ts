import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@domains/auth/services/jwt.service';
import { CustomerChatController } from './customer-chat.controller';
import { CustomerChatService } from './customer-chat.service';

describe('CustomerChatController', () => {
  let controller: CustomerChatController;
  const chat = {
    createSession: jest.fn().mockResolvedValue({ conversationId: 'c1' }),
    sendMessage: jest.fn().mockResolvedValue({
      response: 'ok',
      conversationId: 'c1',
      citations: [],
    }),
    getHistory: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    renameSession: jest.fn().mockResolvedValue({ id: 'c1', title: 'T' }),
    archiveSession: jest.fn().mockResolvedValue(undefined),
    deleteSession: jest.fn().mockResolvedValue(undefined),
    getSuggestions: jest.fn().mockResolvedValue({ questions: ['a'] }),
    submitFeedback: jest
      .fn()
      .mockResolvedValue({ messageId: 'm1', recorded: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerChatController],
      providers: [
        { provide: CustomerChatService, useValue: chat },
        {
          provide: JwtService,
          useValue: { verify: jest.fn().mockReturnValue({ sub: 'u1' }) },
        },
      ],
    }).compile();
    controller = module.get(CustomerChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createSession delegates', async () => {
    await controller.createSession({ guestId: 'g1' }, {
      user: { sub: 'u1' },
    } as any);
    expect(chat.createSession).toHaveBeenCalled();
  });

  it('send delegates', async () => {
    await controller.send({ message: 'hi' }, { user: { sub: 'u1' } } as any);
    expect(chat.sendMessage).toHaveBeenCalled();
  });

  it('history requires sessionId', async () => {
    await expect(
      controller.history('', { page: 1, limit: 10 }, {} as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('history delegates', async () => {
    await controller.history('c1', { page: 1, limit: 10 }, {
      user: { sub: 'u1' },
    } as any);
    expect(chat.getHistory).toHaveBeenCalledWith(
      'c1',
      { page: 1, limit: 10 },
      'u1',
    );
  });

  it('rename delegates', async () => {
    await controller.rename('c1', { title: 'T' }, {
      user: { sub: 'u1' },
    } as any);
    expect(chat.renameSession).toHaveBeenCalled();
  });

  it('archive delegates', async () => {
    await controller.archive('c1', { user: { sub: 'u1' } } as any);
    expect(chat.archiveSession).toHaveBeenCalled();
  });

  it('delete delegates', async () => {
    await controller.remove('c1', { user: { sub: 'u1' } } as any);
    expect(chat.deleteSession).toHaveBeenCalled();
  });

  it('suggestions delegates', async () => {
    await controller.suggestions('c1', { user: { sub: 'u1' } } as any);
    expect(chat.getSuggestions).toHaveBeenCalled();
  });

  it('feedback delegates', async () => {
    await controller.feedback({ messageId: 'm1', isHelpful: true }, {
      user: { sub: 'u1' },
    } as any);
    expect(chat.submitFeedback).toHaveBeenCalled();
  });
});
