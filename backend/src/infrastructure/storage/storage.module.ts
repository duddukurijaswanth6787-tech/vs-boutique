import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.constants';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        localProvider: LocalStorageProvider,
        s3Provider: S3StorageProvider,
      ) => {
        const provider = configService.get<string>(
          'app.storage.provider',
          'local',
        );
        const env = configService.get<string>('app.env', 'development');
        // ponytail: production always uses S3, dev can use local
        if (env === 'production' && provider !== 's3') {
          throw new Error('STORAGE_PROVIDER must be "s3" in production');
        }
        return provider === 's3' ? s3Provider : localProvider;
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
    StorageService,
  ],
  exports: [StorageService, STORAGE_PROVIDER],
})
export class StorageModule {}
