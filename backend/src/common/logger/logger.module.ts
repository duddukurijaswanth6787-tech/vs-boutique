import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as NestjsPinoModule } from 'nestjs-pino';
import { LoggerService } from './logger.service';

/**
 * Custom Pino Logger Module that integrates with NestJS to provide fast, high-performance request/response logging.
 * Exports the custom LoggerService globally.
 */
@Global()
@Module({
  imports: [
    NestjsPinoModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>('app.env') === 'production';
        const isLoggerEnabled = configService.get<boolean>(
          'app.features.logger',
          true,
        );
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            enabled: isLoggerEnabled,
            autoLogging: false,
            // ponytail: use pretty logger in dev and default json logger in prod
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:standard',
                  },
                },
            serializers: {
              req: (req: unknown) => {
                const request = req as {
                  id?: string;
                  method?: string;
                  url?: string;
                };
                return {
                  id: request.id,
                  method: request.method,
                  url: request.url,
                };
              },
              res: (res: unknown) => {
                const response = res as { statusCode?: number };
                return {
                  statusCode: response.statusCode,
                };
              },
              err: (err: unknown) => {
                const error = err as Error;
                return {
                  type: error.name,
                  message: error.message,
                  stack: error.stack,
                };
              },
            },
            customSuccessMessage: (
              req: unknown,
              res: unknown,
              responseTime: number,
            ) => {
              const request = req as { method: string; url: string };
              const response = res as { statusCode: number };
              return `${request.method} ${request.url} - ${response.statusCode} in ${responseTime}ms`;
            },
            customErrorMessage: (req: unknown, res: unknown, err: Error) => {
              const request = req as { method: string; url: string };
              const response = res as { statusCode: number };
              return `${request.method} ${request.url} - ${response.statusCode} - Error: ${err.message}`;
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LoggerService],
  exports: [NestjsPinoModule, LoggerService],
})
export class LoggerModule {}
