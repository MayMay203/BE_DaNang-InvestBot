import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KnowledgeStore } from 'src/entities/knowledgeStore.entity';
import { Material } from 'src/entities/material.entity';
import { Repository } from 'typeorm';

@Injectable()
export class KnowledgeStoreService {
  constructor(
    @InjectRepository(KnowledgeStore)
    private knowledgeStoreRepository: Repository<KnowledgeStore>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async createKnowledgeStore(name: string, description: string) {
    const data = await this.knowledgeStoreRepository.findOne({
      where: { name },
    });
    if (data) throw new Error('Name is existed!');
    const newData = {
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await this.knowledgeStoreRepository.save(newData);
  }

  async getAllKnowledStore() {
    return await this.knowledgeStoreRepository.find();
  }

  async updateKnowledStore(id: number, name: string, description: string) {
    await this.knowledgeStoreRepository.update(id, {
      name,
      description,
      updatedAt: new Date(),
    });
    return await this.knowledgeStoreRepository.findOne({ where: { id } });
  }
  async changeStatusKnowledgeStore(id: number, status: boolean) {
    await this.knowledgeStoreRepository.update(id, { isActive: status });
    return await this.knowledgeStoreRepository.findOne({ where: { id } });
  }

  async addMaterials(knowledgeStoreId: number, materialIds: number[]) {
    const knowledgeStore = await this.knowledgeStoreRepository.findOne({
      where: { id: knowledgeStoreId },
    });
    if (!knowledgeStore) throw new Error('KnowledgeStore not found');

    for (const id of materialIds) {
      await this.materialRepository.update(id, {
        knowledgeStore: knowledgeStore,
      });
    }
  }

  async removeMaterial(knowledgeStoreId: number, materialId: number) {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['knowledgeStore'],
    });

    if (!material) {
      throw new Error('Material not found');
    }

    if (material.knowledgeStore?.id !== knowledgeStoreId) {
      throw new Error(
        'This material is not assigned to the specified KnowledgeStore',
      );
    }

    await this.materialRepository.update(materialId, {
      knowledgeStore: null as any,
    });
  }

  async asyncKnowledgeStore(id: number) {
    const materials = await this.materialRepository.find({
      where: { knowledgeStore: { id } },
      relations: ['materialType', 'accessLevel', 'knowledgeStore'],
    });

    const processed = materials.map((material) => {
      let data = '';
      if (material.materialType.id === 2) {
        data = material.text || '';
      } else {
        data = material.url;
      }
      return {
        id: material.id,
        name: material.name,
        materialType: material.materialType.name,
        accessType: material.accessLevel.name,
        knowledgeStore: material.knowledgeStore.name,
        data,
      };
    });

    const store = await this.knowledgeStoreRepository.findOneBy({ id });
    if (store) {
      store.status = 'Asynced'; 
      await this.knowledgeStoreRepository.save(store);
    }

    return processed;
  }
}
