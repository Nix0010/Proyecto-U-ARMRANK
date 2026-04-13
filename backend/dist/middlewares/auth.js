"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
const authService_1 = require("../services/authService");
/**
 * requireAuth — verifies JWT in Authorization header.
 * If token is valid, attaches payload to req.user.
 * If token is missing/invalid, returns 401.
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Autenticación requerida' });
    }
    const token = authHeader.slice(7);
    try {
        const payload = (0, authService_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
/**
 * optionalAuth — like requireAuth but doesn't block if token is missing.
 * Useful for routes that show extra info when authenticated.
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.user = (0, authService_1.verifyToken)(token);
        }
        catch {
            // ignore invalid token — just proceed unauthenticated
        }
    }
    next();
}
/**
 * requireRole — gates access to specific roles.
 * Must be called AFTER requireAuth.
 */
function requireRole(...roles) {
    return (req, res, next) => {
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
function requireOwnerOrAdmin(getOwnerId) {
    return (req, res, next) => {
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
//# sourceMappingURL=auth.js.map