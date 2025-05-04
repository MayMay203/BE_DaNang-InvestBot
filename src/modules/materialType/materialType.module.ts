import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialType } from 'src/entities/materialType.entity';
import { MaterialTypeService } from './materialType.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialType])],
    providers: [MaterialTypeService],
  exports: [MaterialTypeService]
})
export class MaterialTypeModule {}
