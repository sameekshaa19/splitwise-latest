/**
 * Database Error Handling Utilities
 * Provides standardized error types and handling for database operations
 */

export enum DatabaseErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_DATA = 'INVALID_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Constraint Errors
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  CHECK_CONSTRAINT_VIOLATION = 'CHECK_CONSTRAINT_VIOLATION',
  NOT_NULL_VIOLATION = 'NOT_NULL_VIOLATION',

  // Permission Errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  ROW_LEVEL_SECURITY_VIOLATION = 'ROW_LEVEL_SECURITY_VIOLATION',

  // Connection Errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TIMEOUT_EXPIRED = 'TIMEOUT_EXPIRED',
  CONNECTION_POOL_EXHAUSTED = 'CONNECTION_POOL_EXHAUSTED',

  // Data Errors
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  DATA_CORRUPTION = 'DATA_CORRUPTION',

  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MIGRATION_FAILED = 'MIGRATION_FAILED',
  BACKUP_FAILED = 'BACKUP_FAILED',

  // Business Logic Errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_SPLIT_AMOUNT = 'INVALID_SPLIT_AMOUNT',
  GROUP_MEMBER_LIMIT_EXCEEDED = 'GROUP_MEMBER_LIMIT_EXCEEDED',
  EXPENSE_LIMIT_EXCEEDED = 'EXPENSE_LIMIT_EXCEEDED',
  INVALID_SETTLEMENT = 'INVALID_SETTLEMENT'
}

export class DatabaseError extends Error {
  public readonly code: DatabaseErrorCode;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly originalError?: Error;

  constructor(
    code: DatabaseErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any,
    originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details
    };
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, details?: any) {
    super(DatabaseErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

export class PermissionError extends DatabaseError {
  constructor(message: string = 'Permission denied', details?: any) {
    super(DatabaseErrorCode.PERMISSION_DENIED, message, 403, details);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(DatabaseErrorCode.RECORD_NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class DuplicateError extends DatabaseError {
  constructor(resource: string, field: string, value: any) {
    const message = `${resource} with ${field} '${value}' already exists`;
    super(DatabaseErrorCode.DUPLICATE_RECORD, message, 409, { field, value });
    this.name = 'DuplicateError';
  }
}

/**
 * Error handler for database operations
 */
export class DatabaseErrorHandler {
  /**
   * Convert database errors to standardized DatabaseError instances
   */
  static handleError(error: any, context?: string): DatabaseError {
    console.error(`Database Error in ${context}:`, error);

    // Handle Supabase/PostgreSQL errors
    if (error?.code) {
      return this.handlePostgresError(error, context);
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new DatabaseError(
        DatabaseErrorCode.CONNECTION_FAILED,
        'Network connection failed',
        503,
        { originalMessage: error.message },
        error
      );
    }

    // Handle timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return new DatabaseError(
        DatabaseErrorCode.TIMEOUT_EXPIRED,
        'Database operation timed out',
        408,
        { originalMessage: error.message },
        error
      );
    }

    // Handle validation errors
    if (error.message?.toLowerCase().includes('validation')) {
      return new ValidationError(
        error.message || 'Validation failed',
        { originalError: error }
      );
    }

    // Default to internal error
    return new DatabaseError(
      DatabaseErrorCode.INTERNAL_ERROR,
      error.message || 'An unexpected database error occurred',
      500,
      { context, originalError: error },
      error
    );
  }

  /**
   * Handle specific PostgreSQL error codes
   */
  private static handlePostgresError(error: any, context?: string): DatabaseError {
    const postgresCode = error.code;
    const detail = error.details || error.message;

    switch (postgresCode) {
      // Unique constraint violations
      case '23505':
        return new DuplicateError(
          'Record',
          'unique field',
          detail
        );

      // Foreign key violations
      case '23503':
        return new DatabaseError(
          DatabaseErrorCode.FOREIGN_KEY_VIOLATION,
          'Referenced record does not exist',
          400,
          { constraint: error.constraint, detail }
        );

      // Check constraint violations
      case '23514':
        return new DatabaseError(
          DatabaseErrorCode.CHECK_CONSTRAINT_VIOLATION,
          'Data violates check constraint',
          400,
          { constraint: error.constraint, detail }
        );

      // Not null violations
      case '23502':
        return new DatabaseError(
          DatabaseErrorCode.NOT_NULL_VIOLATION,
          'Required field cannot be null',
          400,
          { column: error.column, detail }
        );

      // Row level security violations
      case '42501':
        return new PermissionError(
          'Access denied by row level security policy',
          { policy: error.detail }
        );

      // Permission denied
      case '42501':
        return new PermissionError(
          'Permission denied',
          { detail }
        );

      default:
        return new DatabaseError(
          DatabaseErrorCode.INTERNAL_ERROR,
          `Database error: ${detail}`,
          500,
          { postgresCode, context }
        );
    }
  }

  /**
   * Validate database operation result
   */
  static validateResult(result: any, operation: string): DatabaseError | null {
    if (!result) {
      return new DatabaseError(
        DatabaseErrorCode.INTERNAL_ERROR,
        `No result returned from ${operation}`,
        500
      );
    }

    if (result.error) {
      return this.handleError(result.error, operation);
    }

    return null;
  }

  /**
   * Create safe database response wrapper
   */
  static wrapOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<{ success: boolean; data?: T; error?: DatabaseError }> {
    return operation()
      .then(data => ({ success: true, data }))
      .catch(error => {
        const dbError = this.handleError(error, context);
        return { success: false, error: dbError };
      });
  }
}

/**
 * Database transaction utilities
 */
export class DatabaseTransaction {
  private static activeTransactions = new Map<string, any>();

  /**
   * Execute operation within transaction context
   */
  static async withTransaction<T>(
    transactionId: string,
    operations: () => Promise<T>
  ): Promise<T> {
    if (this.activeTransactions.has(transactionId)) {
      throw new DatabaseError(
        DatabaseErrorCode.INTERNAL_ERROR,
        'Transaction already exists with this ID',
        400
      );
    }

    try {
      // In a real implementation, this would use the database client's transaction API
      const result = await operations();
      this.activeTransactions.delete(transactionId);
      return result;
    } catch (error) {
      this.activeTransactions.delete(transactionId);
      throw DatabaseErrorHandler.handleError(error, `transaction:${transactionId}`);
    }
  }

  /**
   * Check if transaction is active
   */
  static isActive(transactionId: string): boolean {
    return this.activeTransactions.has(transactionId);
  }
}

/**
 * Database health check utilities
 */
export class DatabaseHealthChecker {
  /**
   * Check database connectivity
   */
  static async checkConnection(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would ping the database
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate DB ping

      const latency = Date.now() - startTime;

      return {
        status: latency < 100 ? 'healthy' : 'degraded',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check table health (basic row counts, etc.)
   */
  static async checkTableHealth(tableName: string): Promise<{
    status: 'healthy' | 'warning' | 'error';
    rowCount?: number;
    error?: string;
  }> {
    try {
      // In a real implementation, this would query the actual table
      return {
        status: 'healthy',
        rowCount: 0 // Placeholder
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Retry utilities for database operations
 */
export class DatabaseRetry {
  /**
   * Execute operation with exponential backoff retry
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation or permission errors
        if (
          error instanceof ValidationError ||
          error instanceof PermissionError ||
          error instanceof NotFoundError
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * Logging utilities for database operations
 */
export class DatabaseLogger {
  /**
   * Log database operation
   */
  static logOperation(
    operation: string,
    userId?: string,
    details?: any,
    duration?: number
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      operation,
      userId,
      details,
      duration,
      level: duration && duration > 1000 ? 'warning' : 'info'
    };

    console.log(`DB Operation: ${operation}`, logData);
  }

  /**
   * Log database error
   */
  static logError(
    error: DatabaseError,
    operation: string,
    userId?: string
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      operation,
      userId,
      error: error.toJSON(),
      level: 'error'
    };

    console.error(`DB Error in ${operation}:`, logData);
  }
}