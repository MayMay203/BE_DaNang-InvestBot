import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeStoreService } from './knowledgeStore.service';
import { KnowledgeStoreController } from './knowledgeStore.controller';
import { KnowledgeStore } from 'src/entities/knowledgeStore.entity';
import { Material } from 'src/entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeStore, Material])],
  providers: [KnowledgeStoreService],
  controllers: [KnowledgeStoreController],
})
export class KnowledgeStoreModule {}
