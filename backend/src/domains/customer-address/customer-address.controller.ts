import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomerAddressService } from './customer-address.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressQueryDto,
} from './customer-address.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Customer Addresses')
@Controller('customer-addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerAddressController {
  constructor(private readonly addressService: CustomerAddressService) {}

  @Get()
  @ApiOperation({ summary: 'List own addresses' })
  async findAll(
    @Query() query: AddressQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.addressService.findAll(user.sub, query),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.addressService.findById(id, user.sub),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  async create(@Body() dto: CreateAddressDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.addressService.create(dto, user.sub),
      'Address created',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.addressService.update(id, dto, user.sub),
      'Address updated',
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.addressService.delete(id, user.sub);
    return ResponseBuilder.deleted('Address deleted');
  }

  @Get('admin/customer/:customerId')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Get addresses of any customer' })
  async findByCustomerIdAdmin(@Param('customerId') customerId: string) {
    const result = await this.addressService.findByCustomerIdAdmin(customerId);
    return ResponseBuilder.success(result);
  }
}
