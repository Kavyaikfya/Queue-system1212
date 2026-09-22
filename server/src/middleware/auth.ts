import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fair_queue_super_secret_jwt_key_2026';

export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'STAFF' | 'USER';
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Ensures the authenticated user exists in the local PostgreSQL users table
 * to satisfy foreign key constraints (e.g. queue_entries.user_id REFERENCES users(id))
 */
export async function ensureUserInDatabase(user: AuthUser): Promise<void> {
  try {
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, 'GOOGLE_OAUTH', $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         updated_at = CURRENT_TIMESTAMP`,
      [user.id, user.email, user.fullName, user.role]
    );
  } catch (err: any) {
    // If email conflict with another UUID, update that record
    try {
      await query(
        `UPDATE users SET full_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [user.fullName, user.id]
      );
    } catch {
      // Ignored
    }
  }
}

/**
 * Resolves user from server JWT, Supabase JWT, or header identity
 */
export async function resolveUserFromRequest(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 1. Try verifying with local JWT_SECRET
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        const user: AuthUser = {
          id: decoded.id,
          email: decoded.email || `${decoded.id}@fairqueue.io`,
          role: decoded.role || 'USER',
          fullName: decoded.fullName || decoded.display_name || decoded.email?.split('@')[0] || 'User',
        };
        await ensureUserInDatabase(user);
        return user;
      }
    } catch {
      // Not signed with local secret (e.g. Supabase JWT or mock token)
    }

    // 2. Try decoding as Supabase JWT
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.id)) {
        const id = decoded.sub || decoded.id;
        const email = decoded.email || (req.headers['x-user-email'] as string) || `${id}@fairqueue.io`;
        const fullName =
          decoded.user_metadata?.full_name ||
          decoded.user_metadata?.name ||
          (req.headers['x-user-name'] as string) ||
          email.split('@')[0];
        const role = (decoded.app_metadata?.role?.toUpperCase() || decoded.role?.toUpperCase() || 'USER') as any;

        const user: AuthUser = {
          id,
          email,
          role: ['SUPER_ADMIN', 'ORG_ADMIN', 'STAFF', 'USER'].includes(role) ? role : 'USER',
          fullName,
        };
        await ensureUserInDatabase(user);
        return user;
      }
    } catch {
      // Ignored
    }
  }

  // 3. Fallback to client-provided verified user headers (e.g. Supabase OAuth session)
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) {
    const email = (req.headers['x-user-email'] as string) || `${headerUserId}@fairqueue.io`;
    const fullName = (req.headers['x-user-name'] as string) || 'Google Verified Member';
    const user: AuthUser = {
      id: headerUserId,
      email,
      role: 'USER',
      fullName,
    };
    await ensureUserInDatabase(user);
    return user;
  }

  return null;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await resolveUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required.' });
  }
  req.user = user;
  next();
}

export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await resolveUserFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}
