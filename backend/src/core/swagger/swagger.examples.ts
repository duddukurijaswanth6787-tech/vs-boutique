export const API_RESPONSE_EXAMPLES = {
  SUCCESS: {
    value: {
      success: true,
      statusCode: 200,
      message: 'Request processed successfully',
      data: {},
      meta: {
        timestamp: '2026-07-09T10:20:00.000Z',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        path: '/api/v1/resource',
        apiVersion: '1.0.0',
      },
    },
  },
  CREATED: {
    value: {
      success: true,
      statusCode: 201,
      message: 'Resource created successfully',
      data: {},
      meta: {
        timestamp: '2026-07-09T10:20:00.000Z',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        path: '/api/v1/resource',
        apiVersion: '1.0.0',
      },
    },
  },
  PAGINATED: {
    value: {
      success: true,
      statusCode: 200,
      message: 'Records retrieved successfully',
      data: [],
      meta: {
        timestamp: '2026-07-09T10:20:00.000Z',
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        path: '/api/v1/resource',
        apiVersion: '1.0.0',
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrevious: false,
        },
      },
    },
  },
  ERROR: {
    value: {
      success: false,
      error: 'BusinessException',
      code: 'BUSINESS_RULE_FAILED',
      message: 'A business rule validation failed',
      timestamp: '2026-07-09T10:20:00.000Z',
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      path: '/api/v1/resource',
      metadata: {},
    },
  },
  VALIDATION_ERROR: {
    value: {
      success: false,
      error: 'ValidationException',
      code: 'INVALID_INPUT',
      message: 'email: email must be a valid email address',
      timestamp: '2026-07-09T10:20:00.000Z',
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      path: '/api/v1/resource',
      metadata: {
        validationErrors: ['email: email must be a valid email address'],
      },
    },
  },
} as const;
