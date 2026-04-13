import type { Request, Response, NextFunction } from 'express';
/**
 * Centralized async error handler.
 * Wraps route handlers so we don't need try/catch everywhere.
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Global Express error middleware.
 * Must be registered LAST in app.
 */
export declare function globalErrorHandler(err: unknown, req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=errorHandler.d.ts.map