import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  StandardApiResponse,
  PaginatedApiResponse,
} from '../responses/response.dto';
import { API_RESPONSE_EXAMPLES } from '@core/swagger/swagger.examples';

/**
 * Swagger response decorator for successful operations returning single objects.
 */
export function SuccessResponse<TModel extends Type<any>>(
  model: TModel,
  message = 'Request processed successfully',
) {
  return applyDecorators(
    ApiExtraModels(StandardApiResponse, model),
    ApiOkResponse({
      description: message,
      schema: {
        allOf: [
          { $ref: getSchemaPath(StandardApiResponse) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Swagger response decorator for creation operations returning single objects.
 */
export function CreatedResponse<TModel extends Type<any>>(
  model: TModel,
  message = 'Resource created successfully',
) {
  return applyDecorators(
    ApiExtraModels(StandardApiResponse, model),
    ApiCreatedResponse({
      description: message,
      schema: {
        allOf: [
          { $ref: getSchemaPath(StandardApiResponse) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Swagger response decorator for paginated query operations.
 */
export function PaginatedResponse<TModel extends Type<any>>(
  model: TModel,
  message = 'Data retrieved successfully',
) {
  return applyDecorators(
    ApiExtraModels(PaginatedApiResponse, model),
    ApiOkResponse({
      description: message,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedApiResponse) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Swagger response decorator for business / system error responses.
 */
export function ApiErrorResponse() {
  return applyDecorators(
    ApiInternalServerErrorResponse({
      description: 'Business or system error occurred',
      content: {
        'application/json': {
          example: API_RESPONSE_EXAMPLES.ERROR.value,
        },
      },
    }),
  );
}

/**
 * Swagger response decorator for validation error responses.
 */
export function ApiValidationResponse() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Request validation failed',
      content: {
        'application/json': {
          example: API_RESPONSE_EXAMPLES.VALIDATION_ERROR.value,
        },
      },
    }),
  );
}

/**
 * Swagger response decorator for empty content operations.
 */
export function EmptyResponse(message = 'No content available') {
  return applyDecorators(
    ApiExtraModels(StandardApiResponse),
    ApiOkResponse({
      description: message,
      schema: {
        allOf: [
          { $ref: getSchemaPath(StandardApiResponse) },
          {
            properties: {
              data: { type: 'null', default: null },
            },
          },
        ],
      },
    }),
  );
}
