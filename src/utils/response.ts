import { NextResponse } from 'next/server';
import { ValidationError } from '../validators';

export function successResponse(data: any = null, message = 'Success', status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message = 'An error occurred', status = 500, errors: any = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
    },
    { status }
  );
}

export function handleRouteError(error: any) {
  console.error('API Route Error:', error);

  if (error instanceof ValidationError) {
    return errorResponse(error.message, 400, error.errors);
  }

  if (error.name === 'ValidationError') {
    // Mongoose Validation Error
    const mongooseErrors: Record<string, string> = {};
    for (const key of Object.keys(error.errors)) {
      mongooseErrors[key] = error.errors[key].message;
    }
    return errorResponse('Mongoose validation failed', 400, mongooseErrors);
  }

  if (error.code === 11000) {
    // Duplicate Key Error
    const field = Object.keys(error.keyPattern)[0];
    return errorResponse(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`, 409);
  }

  const status = error.status || 500;
  return errorResponse(error.message || 'Internal Server Error', status);
}
