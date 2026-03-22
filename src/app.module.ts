import { Module } from '@nestjs/common';
import { LicenseModule } from './license/license.module';

@Module({
  imports: [LicenseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
