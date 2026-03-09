import type { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById, type TokenPayload } from '../services/authService';

// Extend Express Request to carry the authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & { name?: string; avatar?: string | null };
        }
    }
}

/**
 * requireAuth — verifies JWT in Authorization header.
 * If token is valid, attaches payload to req.user.
 * If token is missing/invalid, returns 401.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }

    const token = authHeader.slice(7);
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

/**
 * optionalAuth — like requireAuth but doesn't block if token is missing.
 * Useful for routes that show extra info when authenticated.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = verifyToken(token);
        } catch {
            // ignore invalid token — just proceed unauthenticated
        }
    }
    next();
}

/**
 * requireRole — gates access to specific roles.
 * Must be called AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autenticación requerida' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` });
        }
        next();
    };
}

/**
 * requireOwnerOrAdmin — allows access if the authenticated user is the owner of a resource
 * or has admin role. Pass the owner ID from the route handler.
 */
export function requireOwnerOrAdmin(getOwnerId: (req: Request) => string | null | undefined) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autenticación requerida' });
        }
        const ownerId = getOwnerId(req);
        if (req.user.role === 'admin' || req.user.userId === ownerId) {
            return next();
        }
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    };
}
