/**
 * BREAKING NEWS WALA — Request Validation Middleware
 * Grounded in docs/13-API.md (Section 1.4: Validation & Input Sanitization)
 * Provides reusable schema validation for params, query strings, and request bodies.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';

export interface FieldValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: any[];
  custom?: (value: any) => boolean | string;
  errorMessage?: string;
}

export type SchemaDefinition = Record<string, FieldValidationRule>;

export interface RequestValidationSchema {
  body?: SchemaDefinition;
  query?: SchemaDefinition;
  params?: SchemaDefinition;
}

function validateSection(
  data: any,
  schema: SchemaDefinition,
  sectionName: 'body' | 'query' | 'params'
): ApiErrorDetail[] {
  const errors: ApiErrorDetail[] = [];
  const target = data || {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = target[field];
    const isMissing = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

    if (rule.required && isMissing) {
      errors.push({
        field: `${sectionName}.${field}`,
        code: 'ERR_REQUIRED_FIELD',
        message: rule.errorMessage || `Field "${field}" in ${sectionName} is required.`,
      });
      continue;
    }

    if (isMissing) {
      continue; // Optional field and not provided
    }

    // Type validation
    if (rule.type) {
      if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push({
            field: `${sectionName}.${field}`,
            code: 'ERR_INVALID_TYPE',
            message: rule.errorMessage || `Field "${field}" must be an array.`,
          });
        }
      } else if (rule.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({
            field: `${sectionName}.${field}`,
            code: 'ERR_INVALID_TYPE',
            message: rule.errorMessage || `Field "${field}" must be a number.`,
          });
        } else {
          if (rule.min !== undefined && num < rule.min) {
            errors.push({
              field: `${sectionName}.${field}`,
              code: 'ERR_MIN_VALUE',
              message: rule.errorMessage || `Field "${field}" must be at least ${rule.min}.`,
            });
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push({
              field: `${sectionName}.${field}`,
              code: 'ERR_MAX_VALUE',
              message: rule.errorMessage || `Field "${field}" must be at most ${rule.max}.`,
            });
          }
        }
      } else if (typeof value !== rule.type) {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_INVALID_TYPE',
          message: rule.errorMessage || `Field "${field}" must be of type ${rule.type}.`,
        });
      }
    }

    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_MIN_LENGTH',
          message: rule.errorMessage || `Field "${field}" length must be at least ${rule.minLength} characters.`,
        });
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_MAX_LENGTH',
          message: rule.errorMessage || `Field "${field}" length must not exceed ${rule.maxLength} characters.`,
        });
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_PATTERN_MISMATCH',
          message: rule.errorMessage || `Field "${field}" format is invalid.`,
        });
      }
    }

    // Allowed values (Enum check)
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      errors.push({
        field: `${sectionName}.${field}`,
        code: 'ERR_INVALID_VALUE',
        message: rule.errorMessage || `Field "${field}" must be one of: ${rule.allowedValues.join(', ')}.`,
      });
    }

    // Custom validator
    if (rule.custom) {
      const customRes = rule.custom(value);
      if (typeof customRes === 'string') {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_CUSTOM_VALIDATION',
          message: customRes,
        });
      } else if (customRes === false) {
        errors.push({
          field: `${sectionName}.${field}`,
          code: 'ERR_CUSTOM_VALIDATION',
          message: rule.errorMessage || `Field "${field}" failed validation.`,
        });
      }
    }
  }

  return errors;
}

export function validateRequest(schema: RequestValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const allErrors: ApiErrorDetail[] = [];

    if (schema.params) {
      allErrors.push(...validateSection(req.params, schema.params, 'params'));
    }
    if (schema.query) {
      allErrors.push(...validateSection(req.query, schema.query, 'query'));
    }
    if (schema.body) {
      allErrors.push(...validateSection(req.body, schema.body, 'body'));
    }

    if (allErrors.length > 0) {
      return next(AppError.validationFailed('Request validation failed', allErrors));
    }

    next();
  };
}

