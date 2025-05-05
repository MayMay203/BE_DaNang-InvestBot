import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from 'src/entities/material.entity';
import { GoogleDriveService } from '../googleDrive/googleDrive.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  providers: [MaterialService, GoogleDriveService],
  controllers: [MaterialController],
})
export class MaterialModule {}
