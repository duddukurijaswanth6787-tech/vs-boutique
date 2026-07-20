# Identity Module

## Purpose
Shared identity types, constants, enums, interfaces, and utilities for the identity layer.

## Contents
- **Identity Constants** — role names, hierarchy, system defaults, session/password config
- **Identity Enums** — UserType, AccountStatus, Gender, LoginProvider, RoleScope, PermissionScope, StaffDepartment, StaffDesignation
- **Identity Interfaces** — AuthenticatedUser, JwtPayload, RoleDefinition, PermissionDefinition, SessionContext, UserContext, IdentityContext
- **Identity Utilities** — RoleHelper, PermissionHelper, IdentityFormatter

## Usage
```typescript
import { UserType, AccountStatus } from '@shared/identity';
import { IDENTITY_CONSTANTS } from '@shared/identity';
```

## Dependencies
None — pure TypeScript types, enums, and static utilities.
