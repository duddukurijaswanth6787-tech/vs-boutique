import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@domains/auth/services/jwt.service';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { resolveOptionalAuth } from '@domains/auth/utils/optional-auth.util';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateQuantityDto, MergeCartDto } from './cart.types';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Shopping Cart')
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly jwtService: JwtService,
  ) {}

  private resolveUser(req: Request): { userId?: string; guestId?: string } {
    const { userId } = resolveOptionalAuth(
      this.jwtService,
      req.headers['authorization'],
    );
    if (userId) return { userId };
    return { guestId: (req.query['guestId'] as string) ?? undefined };
  }

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Get cart (works for both guest and customer)' })
  async getCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.getCart(userId, guestId),
    );
  }

  @Get('summary')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Get cart summary' })
  async getCartSummary(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.getCartSummary(userId, guestId),
    );
  }

  @Post('items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Req() req: Request, @Body() dto: AddToCartDto) {
    const authHeader = req.headers['authorization'];
    let userId: string | undefined;
    let guestId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload: JwtPayload = this.jwtService.verify(authHeader.slice(7));
        userId = payload.sub;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else {
      guestId = (req.query['guestId'] as string) ?? req.body?.guestId;
    }

    return ResponseBuilder.success(
      await this.cartService.addItem(userId, guestId, dto),
      'Item added to cart',
    );
  }

  @Patch('items/:itemId')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.updateQuantity(userId, guestId, itemId, dto),
      'Cart updated',
    );
  }

  @Delete('items/:itemId')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.removeItem(userId, guestId, itemId),
      'Item removed',
    );
  }

  @Delete()
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    await this.cartService.clearCart(userId, guestId);
    return ResponseBuilder.deleted('Cart cleared');
  }

  @Post('items/:itemId/save-for-later')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Save item for later' })
  async saveForLater(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.saveForLater(userId, guestId, itemId),
      'Item saved for later',
    );
  }

  @Post('items/:itemId/move-to-cart')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Move saved item back to cart' })
  async moveToCart(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.moveToCart(userId, guestId, itemId),
      'Item moved to cart',
    );
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into customer cart' })
  async mergeCart(@Body() dto: MergeCartDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.cartService.mergeGuestCart(user.sub, dto.guestId),
      'Guest cart merged',
    );
  }

  @Get('admin/customer/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active cart of any customer (Admin only)' })
  async getCartAdmin(@Param('customerId') customerId: string) {
    return ResponseBuilder.success(
      await this.cartService.getCartByCustomerIdAdmin(customerId),
    );
  }
}
