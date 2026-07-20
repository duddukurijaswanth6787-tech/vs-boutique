import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that a string is a secure email address. Injects Swagger docs.
 */
export function IsEmailCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Secure email address',
      format: 'email',
      example: 'customer@vasanthidesigners.com',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isEmailCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid email format`;
          },
        },
      });
    },
  );
}

/**
 * Validates Indian and international phone formats. Injects Swagger docs.
 */
export function IsPhoneNumberCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Contact phone number (Indian or International)',
      example: '+919876543210',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isPhoneNumberCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^(?:\+91|91)?[6789]\d{9}$|^[+]?[1-9]\d{1,14}$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid 10-digit Indian number or international format`;
          },
        },
      });
    },
  );
}

/**
 * Validates password strength (min 8 chars, uppercase, lowercase, digits, and special characters).
 */
export function IsPasswordCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description:
        'Secure user password containing upper, lower, numeric, and special chars',
      format: 'password',
      example: 'P@ssw0rd2026',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isPasswordCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
                value,
              )
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be at least 8 characters long and contain uppercase, lowercase, numeric, and special characters`;
          },
        },
      });
    },
  );
}

/**
 * Validates alphanumeric username format.
 */
export function IsUsernameCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Alphanumeric profile username',
      minLength: 3,
      maxLength: 20,
      example: 'vasanthi_admin',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isUsernameCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' && /^[a-zA-Z0-9_-]{3,20}$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be an alphanumeric string between 3 and 20 characters`;
          },
        },
      });
    },
  );
}

/**
 * Validates UUID v4 format.
 */
export function IsUUIDCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'UUID Version 4 identifier',
      format: 'uuid',
      example: 'f3a466d3-2be2-4467-93aa-bf2a9d8bb1d7',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isUUIDCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                value,
              )
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid UUID v4`;
          },
        },
      });
    },
  );
}

/**
 * Validates URL-friendly slug pattern.
 */
export function IsSlugCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'URL-friendly product or category slug',
      pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
      example: 'designer-silk-saree',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isSlugCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a lowercase URL slug`;
          },
        },
      });
    },
  );
}

/**
 * Validates standard name formatting.
 */
export function IsNameCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Standard user name',
      example: 'Vasanthi Devi',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isNameCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' && /^[a-zA-Z\s]{2,50}$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must contain only alphabetical characters and be between 2 and 50 characters long`;
          },
        },
      });
    },
  );
}

/**
 * Validates positive price formats with max two decimal digits.
 */
export function IsPriceCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Decimal product price value',
      minimum: 0.01,
      example: 2499.5,
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isPriceCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              (typeof value === 'number' || !isNaN(Number(value))) &&
              Number(value) > 0 &&
              /^\d+(?:\.\d{1,2})?$/.test(String(value))
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a positive number with at most 2 decimal places`;
          },
        },
      });
    },
  );
}

/**
 * Validates quantity counts (integers >= 0).
 */
export function IsQuantityCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Integer stock count/quantity',
      minimum: 0,
      example: 50,
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isQuantityCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return Number.isInteger(Number(value)) && Number(value) >= 0;
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a non-negative integer`;
          },
        },
      });
    },
  );
}

/**
 * Validates float percentages (0 to 100).
 */
export function IsPercentageCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Float percentage value (0-100)',
      minimum: 0,
      maximum: 100,
      example: 18.0,
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isPercentageCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            const num = Number(value);
            return !isNaN(num) && num >= 0 && num <= 100;
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a percentage value between 0 and 100`;
          },
        },
      });
    },
  );
}

/**
 * Validates standard Indian GSTIN codes.
 */
export function IsGSTCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: '15-digit Indian GSTIN tax registration code',
      example: '33AABCV1234F1Z5',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isGSTCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(
                value,
              )
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid 15-character Indian GSTIN registration number`;
          },
        },
      });
    },
  );
}

/**
 * Validates discounts (greater than or equal to 0).
 */
export function IsDiscountCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Discount pricing deduction value',
      minimum: 0,
      example: 500.0,
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isDiscountCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            const num = Number(value);
            return !isNaN(num) && num >= 0;
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a positive discount amount`;
          },
        },
      });
    },
  );
}

/**
 * Validates 3-character ISO currency abbreviations.
 */
export function IsCurrencyCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: '3-character ISO currency code',
      example: 'INR',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isCurrencyCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid 3-letter currency code (e.g. INR)`;
          },
        },
      });
    },
  );
}

/**
 * Validates ISO YYYY-MM-DD Date strings.
 */
export function IsDateCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'ISO format date string (YYYY-MM-DD)',
      example: '2026-07-09',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isDateCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(value) &&
              !isNaN(Date.parse(value))
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid ISO date string (YYYY-MM-DD)`;
          },
        },
      });
    },
  );
}

/**
 * Validates 24-hour time strings (HH:MM or HH:MM:SS).
 */
export function IsTimeCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: '24-hour format time string (HH:MM:SS)',
      example: '14:30:00',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isTimeCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid 24-hour time format (HH:MM:SS)`;
          },
        },
      });
    },
  );
}

/**
 * Validates ISO DateTime strings.
 */
export function IsDateTimeCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'ISO format datetime timestamp',
      example: '2026-07-09T14:30:00.000Z',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isDateTimeCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return typeof value === 'string' && !isNaN(Date.parse(value));
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid ISO datetime format`;
          },
        },
      });
    },
  );
}

/**
 * Validates URL structures.
 */
export function IsURLCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Web URL address link',
      example: 'https://vasanthidesigners.com',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isURLCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid URL`;
          },
        },
      });
    },
  );
}

/**
 * Validates secure filename constraints (no path traversals).
 */
export function IsFileNameCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description:
        'Secure filename (lowercase alphanumeric, dots, and hyphens)',
      example: 'saree_image.png',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isFileNameCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /^[a-zA-Z0-9_\-.]+$/.test(value) &&
              !value.includes('..')
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a secure filename containing only alphanumeric characters, underscores, hyphens, and dots`;
          },
        },
      });
    },
  );
}

/**
 * Validates standard image file extensions.
 */
export function IsImageCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Path or name of an image file (.jpg, .png, .webp)',
      example: 'banner.webp',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isImageCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /\.(jpe?g|png|webp|gif)$/i.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid image file type (.jpg, .jpeg, .png, .webp, .gif)`;
          },
        },
      });
    },
  );
}

/**
 * Validates standard video file extensions.
 */
export function IsVideoCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Path or name of a video file (.mp4, .mov, .webm)',
      example: 'ad_clip.mp4',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isVideoCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' && /\.(mp4|mov|webm|mkv)$/i.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid video file type (.mp4, .mov, .webm, .mkv)`;
          },
        },
      });
    },
  );
}

/**
 * Validates standard document extensions.
 */
export function IsDocumentCustom(validationOptions?: ValidationOptions) {
  return applyDecorators(
    ApiProperty({
      description: 'Path or name of a document file (.pdf, .xlsx, .csv)',
      example: 'invoice.pdf',
    }),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isDocumentCustom',
        target: target.constructor,
        propertyName: propertyKey as string,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return (
              typeof value === 'string' &&
              /\.(pdf|xlsx?|csv|docx?)$/i.test(value)
            );
          },
          defaultMessage(args: ValidationArguments) {
            return `${args.property} must be a valid document file type (.pdf, .xls, .xlsx, .csv, .doc, .docx)`;
          },
        },
      });
    },
  );
}
