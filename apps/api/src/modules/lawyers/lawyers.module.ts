import { Module } from '@nestjs/common';
import { LawyersController } from './lawyers.controller';
import { LawyersService } from './lawyers.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [LawyersController],
  providers: [LawyersService],
  exports: [LawyersService],
})
export class LawyersModule {}
