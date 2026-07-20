import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { CustomerProfileModule } from '@domains/customer-profile/customer-profile.module';
import { CustomerAddressModule } from '@domains/customer-address/customer-address.module';
import { WishlistModule } from '@domains/wishlist/wishlist.module';
import { CartModule } from '@domains/cart/cart.module';
import { MeController } from './me.controller';

@Module({
  imports: [
    AuthModule,
    CustomerProfileModule,
    CustomerAddressModule,
    WishlistModule,
    CartModule,
  ],
  controllers: [MeController],
})
export class MeModule {}
