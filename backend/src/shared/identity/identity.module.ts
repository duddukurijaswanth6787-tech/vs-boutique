import { Global, Module } from '@nestjs/common';

/**
 * Shared Identity Module providing identity-related types, constants, enums,
 * interfaces, and utilities used across all identity domain modules.
 *
 * This module is global — its exports are available to all modules without
 * explicit import. Identity types are pure TypeScript and do not require
 * runtime providers, but the module serves as a structural anchor for
 * the identity layer.
 */
@Global()
@Module({})
export class IdentityModule {}
