import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nContext } from 'nestjs-i18n';
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

  async createKnowledgeStore(name: string, description: string, i18n: I18nContext) {
    const data = await this.knowledgeStoreRepository.findOne({
      where: { name },
    });
    if (data) throw new Error(i18n.t('common.existed_name'));
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

  async addMaterials(knowledgeStoreId: number, materialIds: number[], i18n:I18nContext) {
    const knowledgeStore = await this.knowledgeStoreRepository.findOne({
      where: { id: knowledgeStoreId },
    });
    if (!knowledgeStore) throw new Error(i18n.t('common.knowledge_store_not_found'));

    for (const id of materialIds) {
      await this.materialRepository.update(id, {
        knowledgeStore: knowledgeStore,
      });
    }
  }

  async removeMaterial(knowledgeStoreId: number, materialId: number, i18n: I18nContext) {
    const material = await this.materialRepository.findOne({
      where: { id: materialId },
      relations: ['knowledgeStore'],
    });

    if (!material) {
      throw new Error(i18n.t('common.material_not_found'));
    }

    if (material.knowledgeStore?.id !== knowledgeStoreId) {
      throw new Error(
        i18n.t('common.not_assigned_material'),
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
