"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.globalErrorHandler = globalErrorHandler;
/**
 * Centralized async error handler.
 * Wraps route handlers so we don't need try/catch everywhere.
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Global Express error middleware.
 * Must be registered LAST in app.
 */
function globalErrorHandler(err, req, res, next) {
    console.error('[ERROR]', err);
    // Zod validation errors
    if (err && typeof err === 'object' && 'issues' in err) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: err.issues,
        });
    }
    // Prisma "not found" errors
    if (err instanceof Error &&
        err.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    const message = process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : 'Error interno del servidor';
    res.status(500).json({ error: message });
}
//# sourceMappingURL=errorHandler.js.map