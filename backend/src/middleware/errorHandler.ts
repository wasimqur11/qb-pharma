import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface DetailedError extends Error {
  code?: string;
  statusCode?: number;
  details?: string;
  operation?: string;
}

export class CRUDError extends Error {
  public details?: string;
  
  constructor(
    public operation: string,
    public resource: string,
    public originalError: any,
    public statusCode: number = 500,
    details?: string
  ) {
    super(`${operation} operation failed for ${resource}`);
    this.name = 'CRUDError';
    this.details = details;
  }
}

export const errorLogger = (operation: string, resource: string, startTime: number) => {
  return {
    success: (id?: string, count?: number) => {
      const duration = Date.now() - startTime;
      const identifier = id ? ` (id: ${id})` : count ? ` (${count} records)` : '';
      console.log(`✅ ${operation} ${resource}${identifier} successful (${duration}ms)`);
    },
    error: (error: any, details?: string) => {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operation} ${resource} failed (${duration}ms):`, error.message || error);
      if (details) {
        console.error(`📝 Additional details: ${details}`);
      }
    },
    validation: (errors: any) => {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operation} ${resource} validation failed (${duration}ms):`, errors);
    }
  };
};

export const handleCRUDError = (
  error: any, 
  operation: string, 
  resource: string, 
  res: Response,
  logger: ReturnType<typeof errorLogger>
) => {
  // Validation errors
  if (error instanceof z.ZodError) {
    logger.validation(error.errors);
    return res.status(400).json({
      error: 'Validation error',
      operation,
      resource,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }

  // Prisma errors
  if (error.code) {
    logger.error(error, `Prisma error: ${error.code}`);
    
    switch (error.code) {
      case 'P1001':
        return res.status(503).json({
          error: 'Database connection failed',
          operation,
          resource,
          details: 'Unable to connect to database. Please try again later.'
        });
      
      case 'P2002':
        return res.status(409).json({
          error: 'Duplicate entry',
          operation,
          resource,
          details: `A record with this ${error.meta?.target?.join(', ')} already exists.`
        });
      
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found',
          operation,
          resource,
          details: 'The requested record does not exist or has been deleted.'
        });
      
      case 'P2003':
        return res.status(400).json({
          error: 'Foreign key constraint failed',
          operation,
          resource,
          details: 'Referenced record does not exist or cannot be deleted due to dependencies.'
        });
      
      case 'P2014':
        return res.status(400).json({
          error: 'Invalid relation',
          operation,
          resource,
          details: 'The change you are trying to make would violate the required relation.'
        });
      
      default:
        return res.status(500).json({
          error: 'Database error',
          operation,
          resource,
          details: 'A database error occurred.',
          code: error.code
        });
    }
  }

  // Custom CRUD errors
  if (error instanceof CRUDError) {
    logger.error(error.originalError, error.details || 'Custom CRUD error');
    return res.status(error.statusCode).json({
      error: error.message,
      operation: error.operation,
      resource: error.resource,
      details: error.details || 'An error occurred during CRUD operation.'
    });
  }

  // Generic errors
  logger.error(error, 'Unexpected error');
  return res.status(500).json({
    error: 'Internal server error',
    operation,
    resource,
    details: 'An unexpected error occurred. Please try again later.'
  });
};

export const globalErrorHandler = (
  error: DetailedError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`🚨 Global error handler caught:`, error);
  
  const statusCode = error.statusCode || 500;
  const operation = error.operation || req.method;
  const resource = req.route?.path || req.path;
  
  res.status(statusCode).json({
    error: error.message || 'Internal server error',
    operation,
    resource,
    details: error.details || 'An unexpected error occurred.',
    timestamp: new Date().toISOString()
  });
};