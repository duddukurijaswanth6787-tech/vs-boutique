import { Logger } from '@nestjs/common';
import { performance } from 'perf_hooks';

/**
 * Decorator that logs Service method execution phases (start, resolve, and thrown exceptions).
 */
export function LogService(): MethodDecorator {
  const logger = new Logger('ServiceTracker');
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const className =
        (target.constructor?.name as string) || 'UnknownService';
      const methodName = String(propertyKey);
      logger.log(`[${className}] Calling ${methodName}()`);

      try {
        const result = originalMethod.apply(this, args);
        if (result instanceof Promise) {
          return result
            .then((res) => {
              logger.log(
                `[${className}] Successfully resolved ${methodName}()`,
              );
              return res;
            })
            .catch((err: Error) => {
              logger.error(
                `[${className}] Exception in async ${methodName}(): ${err.message}`,
                err.stack,
              );
              throw err;
            });
        }
        logger.log(`[${className}] Successfully returned ${methodName}()`);
        return result;
      } catch (err: unknown) {
        const error = err as Error;
        logger.error(
          `[${className}] Exception in ${methodName}(): ${error.message}`,
          error.stack,
        );
        throw err;
      }
    };
    return descriptor;
  };
}

/**
 * Decorator that logs Controller request routing entries.
 */
export function LogController(): MethodDecorator {
  const logger = new Logger('ControllerTracker');
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const className =
        (target.constructor?.name as string) || 'UnknownController';
      const methodName = String(propertyKey);
      logger.log(`[${className}] Route Handler triggered: ${methodName}()`);

      try {
        const result = originalMethod.apply(this, args);
        if (result instanceof Promise) {
          return result
            .then((res) => {
              logger.log(
                `[${className}] Route Handler successfully processed: ${methodName}()`,
              );
              return res;
            })
            .catch((err: Error) => {
              logger.error(
                `[${className}] Route Handler threw async exception in ${methodName}(): ${err.message}`,
              );
              throw err;
            });
        }
        logger.log(
          `[${className}] Route Handler successfully processed: ${methodName}()`,
        );
        return result;
      } catch (err: unknown) {
        const error = err as Error;
        logger.error(
          `[${className}] Route Handler threw exception in ${methodName}(): ${error.message}`,
        );
        throw err;
      }
    };
    return descriptor;
  };
}

/**
 * Decorator that calculates method execution duration and logs a warning for slow queries.
 * @param slowThresholdMs Response duration threshold in milliseconds (default: 500ms).
 */
export function LogPerformance(slowThresholdMs = 500): MethodDecorator {
  const logger = new Logger('PerformanceTracker');
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const className = (target.constructor?.name as string) || 'Class';
      const methodName = String(propertyKey);
      const start = performance.now();

      const logTime = (timeTaken: number) => {
        const msg = `[${className}] ${methodName}() took ${timeTaken.toFixed(2)}ms`;
        if (timeTaken > slowThresholdMs) {
          logger.warn(`SLOW METHOD WARNING: ${msg}`);
        } else {
          logger.log(msg);
        }
      };

      try {
        const result = originalMethod.apply(this, args);
        if (result instanceof Promise) {
          return result.then((res) => {
            const end = performance.now();
            logTime(end - start);
            return res;
          });
        }
        const end = performance.now();
        logTime(end - start);
        return result;
      } catch (err) {
        const end = performance.now();
        logTime(end - start);
        throw err;
      }
    };
    return descriptor;
  };
}
