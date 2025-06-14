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
  ) { }

  async createKnowledgeStore(
    name: string,
    description: string,
    i18n: I18nContext,
  ) {
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

  async getDetailKnowledgeStore(id: number) {
    const store = await this.knowledgeStoreRepository.findOne({
      where: { id },
    });
    return store;
  }

  async getAllKnowledStore() {
    const stores = await this.knowledgeStoreRepository.find();

    const result = await Promise.all(
      stores.map(async (store) => {
        const numberMaterials = await this.materialRepository.count({
          where: { knowledgeStore: { id: store.id } },
        });

        return {
          ...store,
          numberMaterials,
        };
      }),
    );

    const reversedResult = result.reverse();
    return reversedResult;
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
    const materials = await this.materialRepository.find({
      where: { knowledgeStore: { id } },
      relations: ['knowledgeStore'],
    });
    for (const material of materials) {
      await this.materialRepository.update(material.id, { isActive: status });
    }
    return materials;
  }

  async addMaterials(
    knowledgeStoreId: number,
    materialIds: number[],
    i18n: I18nContext,
  ) {
    const knowledgeStore = await this.knowledgeStoreRepository.findOne({
      where: { id: knowledgeStoreId },
    });
    if (!knowledgeStore)
      throw new Error(i18n.t('common.knowledge_store_not_found'));

    for (const id of materialIds) {
      await this.materialRepository.update(id, {
        knowledgeStore: knowledgeStore,
      });
    }
  }

  async removeMaterial(
    knowledgeStoreId: number,
    materialIds: number[],
    i18n: I18nContext,
  ) {
    for (const materialId of materialIds) {
      const material = await this.materialRepository.findOne({
        where: { id: materialId },
        relations: ['knowledgeStore'],
      });

      if (!material) {
        throw new Error(i18n.t('common.material_not_found'));
      }

      if (material.knowledgeStore?.id !== knowledgeStoreId) {
        throw new Error(i18n.t('common.not_assigned_material'));
      }

      await this.materialRepository.update(materialId, {
        knowledgeStore: null as any,
      });
    }
  }

  async deleteKnowledgeStore(id: number) {
    const materialList = await this.materialRepository.find({
      where: { knowledgeStore: { id } },
      relations: ['knowledgeStore'],
    });

    for (const material of materialList) {
      material.knowledgeStore = null;
      await this.materialRepository.save(material);
    }

    await this.knowledgeStoreRepository.delete(id);
  }
}
