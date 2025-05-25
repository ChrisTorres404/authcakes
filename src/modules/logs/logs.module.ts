// src/modules/logs/logs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from './entities/log.entity';
import { LogsService } from './services/logs.service';
import { LogsController } from './controllers/logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Log]),
  ],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}