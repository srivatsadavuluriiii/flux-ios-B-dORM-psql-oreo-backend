import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { z, type ZodSchema, type ZodError } from 'zod';

/**
 * Validation middleware type for Flux backend
 */
export type ValidationMiddleware = (event: RequestEvent) => Promise<Response | null>;

/**
 * Common Zod schemas for Flux backend validation
 */
export const schemas = {
  // Common field validations
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  
  // User schemas
  userRegistration: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50)
  }),
  
  userLogin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  }),
  
  // Expense schemas
  expenseCreate: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3-letter code').default('INR'),
    category: z.string().min(1, 'Category is required'),
    description: z.string().max(500).optional(),
    date: z.string().datetime('Invalid date format'),
    groupId: z.string().uuid('Invalid group ID').optional()
  }),
  
  expenseUpdate: z.object({
    title: z.string().min(1, 'Title is required').max(100).optional(),
    amount: z.number().positive('Amount must be positive').optional(),
    currency: z.string().length(3, 'Currency must be 3-letter code').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    description: z.string().max(500).optional(),
    date: z.string().datetime('Invalid date format').optional()
  }),
  
  // Group schemas
  groupCreate: z.object({
    name: z.string().min(1, 'Group name is required').max(50),
    description: z.string().max(200).optional(),
    type: z.enum(['personal', 'travel', 'business', 'household']).default('personal')
  }),
  
  groupUpdate: z.object({
    name: z.string().min(1, 'Group name is required').max(50).optional(),
    description: z.string().max(200).optional()
  }),
  
  // Payment schemas
  paymentCreate: z.object({
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().length(3, 'Currency must be 3-letter code').default('INR'),
    payerId: z.string().uuid('Invalid payer ID'),
    payeeId: z.string().uuid('Invalid payee ID'),
    groupId: z.string().uuid('Invalid group ID'),
    description: z.string().max(200).optional()
  }),
  
  // Common query parameter schemas
  paginationParams: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  
  dateRangeParams: z.object({
    startDate: z.string().datetime('Invalid start date format').optional(),
    endDate: z.string().datetime('Invalid end date format').optional()
  })
} as const;

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>): ValidationMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    try {
      // Only validate if request has a body
      if (!['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
        return null;
      }

      const contentType = event.request.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        return json(
          {
            success: false,
            error: {
              code: 'INVALID_CONTENT_TYPE',
              message: 'Content-Type must be application/json',
              details: { receivedContentType: contentType }
            }
          },
          { status: 400 }
        );
      }

      let body: unknown;
      try {
        const text = await event.request.text();
        body = text ? JSON.parse(text) : {};
      } catch (error) {
        return json(
          {
            success: false,
            error: {
              code: 'INVALID_JSON',
              message: 'Request body must be valid JSON',
              details: { parseError: error?.toString() }
            }
          },
          { status: 400 }
        );
      }

      const result = schema.safeParse(body);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        console.warn('[Flux Validation] Body validation failed:', {
          url: event.url.pathname,
          method: event.request.method,
          errors: validationErrors
        });
        
        return json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request body validation failed',
              details: {
                fields: validationErrors
              }
            }
          },
          { status: 400 }
        );
      }

      // Store validated data in locals for use in route handler
      event.locals.validatedBody = result.data;
      
      return null;
    } catch (error) {
      console.error('[Flux Validation] Validation middleware error:', error);
      
      return json(
        {
          success: false,
          error: {
            code: 'VALIDATION_MIDDLEWARE_ERROR',
            message: 'Internal validation error'
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>): ValidationMiddleware {
  return async (event: RequestEvent): Promise<Response | null> => {
    try {
      const url = new URL(event.request.url);
      const queryParams: Record<string, string | string[]> = {};
      
      // Convert URLSearchParams to object
      url.searchParams.forEach((value, key) => {
        const existing = queryParams[key];
        if (existing) {
          queryParams[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
          queryParams[key] = value;
        }
      });

      const result = schema.safeParse(queryParams);
      
      if (!result.success) {
        const validationErrors = formatZodErrors(result.error);
        
        console.warn('[Flux Validation] Query validation failed:', {
          url: event.url.pathname,
          query: Object.fromEntries(url.searchParams),
          errors: validationErrors
        });
        
        return json(
          {
            success: false,
            error: {
              code: 'QUERY_VALIDATION_ERROR',
              message: 'Query parameter validation failed',
              details: {
                fields: validationErrors
              }
            }
          },
          { status: 400 }
        );
      }

      // Store validated query params in locals
      event.locals.validatedQuery = result.data;
      
      return null;
    } catch (error) {
      console.error('[Flux Validation] Query validation middleware error:', error);
      
      return json(
        {
          success: false,
          error: {
            code: 'QUERY_VALIDATION_MIDDLEWARE_ERROR',
            message: 'Internal query validation error'
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Format Zod validation errors for API response
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const field = path || 'root';
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(err.message);
  });
  
  return formattedErrors;
}

/**
 * Commonly used validation middleware instances
 */
export const validateUserRegistration = validateBody(schemas.userRegistration);
export const validateUserLogin = validateBody(schemas.userLogin);
export const validateExpenseCreate = validateBody(schemas.expenseCreate);
export const validateExpenseUpdate = validateBody(schemas.expenseUpdate);
export const validateGroupCreate = validateBody(schemas.groupCreate);
export const validateGroupUpdate = validateBody(schemas.groupUpdate);
export const validatePaymentCreate = validateBody(schemas.paymentCreate);
export const validatePagination = validateQuery(schemas.paginationParams);
export const validateDateRange = validateQuery(schemas.dateRangeParams); 