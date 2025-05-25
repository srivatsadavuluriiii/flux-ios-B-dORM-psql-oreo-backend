import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

/**
 * Error handler middleware type for Flux backend
 */
export type ErrorHandlerMiddleware = (event: RequestEvent) => Promise<Response | null>;

/**
 * Create error handling middleware for API responses
 */
export function createErrorHandler(): ErrorHandlerMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    try {
      // This middleware runs after the route handler
      // It should be integrated into hooks.server.ts
      return null;
    } catch (error) {
      console.error('[Flux Error Handler] Middleware error:', error);
      return null;
    }
  };
}

/**
 * Handle API errors with consistent format
 */
export function handleApiError(
  error: unknown,
  context: {
    method: string;
    url: string;
    userAgent?: string;
  }
): Response {
  const requestId = crypto.randomUUID();
  
  // Log error details
  console.error(`[Flux Error ${requestId}]`, {
    error: error?.toString(),
    stack: (error as Error)?.stack,
    context,
    timestamp: new Date().toISOString()
  });

  // Determine error type and status
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof Error) {
    if (error.name === 'ValidationError') {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = error.message;
    } else if (error.name === 'UnauthorizedError') {
      status = 401;
      code = 'UNAUTHORIZED';
      message = 'Authentication required';
    } else if (error.name === 'ForbiddenError') {
      status = 403;
      code = 'FORBIDDEN';
      message = 'Access denied';
    } else if (error.name === 'NotFoundError') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'Resource not found';
    }
  }

  return json(
    {
      success: false,
      error: {
        code,
        message,
        requestId,
        timestamp: new Date().toISOString()
      }
    },
    {
      status,
      headers: {
        'X-Error-ID': requestId,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Wrap route handlers with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const event = args[0] as RequestEvent;
      return handleApiError(error, {
        method: event.request.method,
        url: event.url.toString(),
        userAgent: event.request.headers.get('user-agent') || undefined
      });
    }
  }) as T;
} 