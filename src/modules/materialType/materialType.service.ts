import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialType } from 'src/entities/materialType.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MaterialTypeService {
  constructor(
    @InjectRepository(MaterialType)
    private readonly materialTypeRepository: Repository<MaterialType>,
  ) {}

  async seedMaterialTypeIfEmpty() {
    const count = await this.materialTypeRepository.count();
    if (count > 1) return;

    const materialTypes = ['file', 'content', 'url'];
    await this.materialTypeRepository.save(
      materialTypes.map((name) => ({ name })),
    );
  }
}
