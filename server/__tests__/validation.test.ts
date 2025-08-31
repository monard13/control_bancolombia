import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { validate } from '../middleware/validate';
import { z } from 'zod';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  const testSchema = z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(18, 'Must be at least 18')
    })
  });

  it('should pass validation with valid data', async () => {
    mockRequest.body = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    };

    await validate(testSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should fail validation with invalid data', async () => {
    mockRequest.body = {
      name: '',
      email: 'not-an-email',
      age: 16
    };

    await validate(testSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.stringContaining('Name is required'),
          expect.stringContaining('Invalid email'),
          expect.stringContaining('Must be at least 18')
        ])
      })
    );
  });

  it('should handle missing required fields', async () => {
    mockRequest.body = {};

    await validate(testSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should handle type coercion correctly', async () => {
    const coercionSchema = z.object({
      body: z.object({
        age: z.coerce.number().min(18)
      })
    });

    mockRequest.body = {
      age: '25' // String that should be coerced to number
    };

    await validate(coercionSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.body.age).toBe(25); // Should be converted to number
  });
});
