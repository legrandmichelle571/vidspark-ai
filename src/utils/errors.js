/**
 * Custom Error Classes
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class QuotaExceededError extends AppError {
  constructor(message = 'Quota exceeded', quota = {}) {
    super(message, 429);
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

class PaymentError extends AppError {
  constructor(message, statusCode = 402) {
    super(message, statusCode);
    this.name = 'PaymentError';
  }
}

class ExternalServiceError extends AppError {
  constructor(message, service = 'Unknown') {
    super(`${service} service error: ${message}`, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(`Database error: ${message}`, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  QuotaExceededError,
  PaymentError,
  ExternalServiceError,
  DatabaseError
};
