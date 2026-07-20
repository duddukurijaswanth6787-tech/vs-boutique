import { JwtService } from '../services/jwt.service';
import type { JwtPayload } from '../services/jwt.service';

// ponytail: shared optional auth resolution for guest/customer endpoints
// Parses JWT if present, returns payload or null. Does NOT throw on missing/invalid token.
export function resolveOptionalAuth(
  jwtService: JwtService,
  authHeader: string | undefined,
): { userId?: string; payload?: JwtPayload } {
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwtService.verify(authHeader.slice(7));
      return { userId: payload.sub, payload };
    } catch {
      // ponytail: invalid/expired token treated as anonymous — not logged
    }
  }
  return {};
}
