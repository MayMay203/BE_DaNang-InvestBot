import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from 'src/entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  providers: [MaterialService],
  controllers: [MaterialController],
})
export class MaterialModule {}
