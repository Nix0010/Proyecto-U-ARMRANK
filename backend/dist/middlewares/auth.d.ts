import type { Request, Response, NextFunction } from 'express';
import { type TokenPayload } from '../services/authService';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & {
                name?: string;
                avatar?: string | null;
            };
        }
    }
}
/**
 * requireAuth — verifies JWT in Authorization header.
 * If token is valid, attaches payload to req.user.
 * If token is missing/invalid, returns 401.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * optionalAuth — like requireAuth but doesn't block if token is missing.
 * Useful for routes that show extra info when authenticated.
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * requireRole — gates access to specific roles.
 * Must be called AFTER requireAuth.
 */
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * requireOwnerOrAdmin — allows access if the authenticated user is the owner of a resource
 * or has admin role. Pass the owner ID from the route handler.
 */
export declare function requireOwnerOrAdmin(getOwnerId: (req: Request) => string | null | undefined): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map