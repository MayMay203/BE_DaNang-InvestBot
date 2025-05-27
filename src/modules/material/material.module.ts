import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from 'src/entities/material.entity';
import { GoogleDriveService } from '../googleDrive/googleDrive.service';
import { ConfigService } from '@nestjs/config';
import { KnowledgeStoreService } from '../knowledgeStore/knowledgeStore.service';
import { KnowledgeStore } from 'src/entities/knowledgeStore.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Material, KnowledgeStore])],
  providers: [
    MaterialService,
    GoogleDriveService,
    ConfigService,
    KnowledgeStoreService,
  ],
  controllers: [MaterialController],
  // Phải export để cho phép dùng service này trong module khác
  exports: [MaterialService],
})
export class MaterialModule {}
