import type { Request, Response, NextFunction } from 'express';

/**
 * Centralized async error handler.
 * Wraps route handlers so we don't need try/catch everywhere.
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Global Express error middleware.
 * Must be registered LAST in app.
 */
export function globalErrorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('[ERROR]', err);

    // Zod validation errors
    if (err && typeof err === 'object' && 'issues' in err) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: (err as { issues: unknown[] }).issues,
        });
    }

    // Prisma "not found" errors
    if (
        err instanceof Error &&
        err.message.includes('Record to update not found')
    ) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    const message =
        process.env.NODE_ENV === 'development' && err instanceof Error
            ? err.message
            : 'Error interno del servidor';

    res.status(500).json({ error: message });
}
