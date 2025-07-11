import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialDTO } from 'src/DTO/material/material.dto';
import { Material } from 'src/entities/material.entity';
import { Repository } from 'typeorm';
import { GoogleDriveService } from '../googleDrive/googleDrive.service';
import { KnowledgeStoreService } from '../knowledgeStore/knowledgeStore.service';
import { I18nContext } from 'nestjs-i18n';

type StoreGroup = {
  materials: string[];
  storeId: number;
  storeName: string;
  storeDesc: string;
};

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private readonly googleDriveService: GoogleDriveService,
    private readonly knowlegdeStoreService: KnowledgeStoreService,
  ) {}

  async addBasicMaterial(data: MaterialDTO[]){
    await this.materialRepository.save(data)
  }

  async uploadFilesToDriveOnly(
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const driveLinks: string[] = [];

    // Create folder and share
    const folderId =
      await this.googleDriveService.createAndShareFolder('MyUploads');

    for (const file of files) {
      const urlFile = await this.googleDriveService.uploadToDrive(
        file,
        folderId,
      );
      driveLinks.push(urlFile);
    }

    return driveLinks;
  }

  private extractFileIdFromDriveLink(link: string): string | null {
    const match = link.match(/\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1] || match[2];
    }
    return null;
  }

  async deleteFilesFromDrive(driveLinks: string[]): Promise<void> {
    for (const link of driveLinks) {
      const fileId = this.extractFileIdFromDriveLink(link);
      if (fileId) {
        await this.googleDriveService.deleteFile(fileId);
      }
    }
  }

  async addMaterial(
    data: MaterialDTO,
    files: Express.Multer.File[],
    accountId: number,
  ) {
    const results: any[] = [];

    if (Number(data.materialTypeId) === 1 && files?.length) {
      const folderId =
        await this.googleDriveService.createAndShareFolder('MyUploads');

      for (const file of files) {
        const urlFile = await this.googleDriveService.uploadToDrive(
          file,
          folderId,
        );

        const originalNameBuffer = Buffer.from(file.originalname, 'latin1');  
        const fixedName = originalNameBuffer.toString('utf8');

          const materialData = {
            name: fixedName,
            description: fixedName,
            text: data.text,
            url: urlFile,
            createdAt: new Date(),
            updatedAt: new Date(),
            materialType: { id: Number(data.materialTypeId) },
            accessLevel: { id: Number(data.accessLevelId) },
            account: { id: Number(accountId) },
          };

        const saved = await this.materialRepository.save(materialData);

        const savedMaterial = await this.materialRepository.findOne({
          where: { id: saved.id },
          relations: ['materialType', 'accessLevel'],
        });

        results.push(savedMaterial);
      }
      return results;
    }

    const urls =
      typeof data.url === 'string'
        ? data.url
            .split(/[\n,]+/)
            .map((url) => url.trim())
            .filter(Boolean)
        : [];

    const commonData = {
      name: data.name,
      description: data.description,
      text: data.text,
      createdAt: new Date(),
      updatedAt: new Date(),
      materialType: { id: Number(data.materialTypeId) },
      accessLevel: { id: Number(data.accessLevelId) },
      account: { id: Number(accountId) },
    };

    if (urls.length > 1) {
      const results: any[] = [];

      for (const url of urls) {
        const materialData = {
          ...commonData,
          url,
        };
        const saved = await this.materialRepository.save(materialData);
        results.push(saved);
      }

      return results;
    }

    // Trường hợp chỉ có 1 URL
    const materialData = {
      ...commonData,
      url: data.url,
    };

    return await this.materialRepository.save([materialData]);
  }

  async getAllMaterials(store?: string, role?: string) {
    let whereCondition = {};
    if (store && !store.includes('empty')) {
      whereCondition = { knowledgeStore: { id: store } };
    }

    let materials = await this.materialRepository.find({
      where: whereCondition,
      relations: [
        'knowledgeStore',
        'materialType',
        'accessLevel',
        'account',
        'account.role',
      ],
      order: { id: 'DESC' },
    });

    if (store?.includes('empty')) {
      const storeId = Number(store.split('/')[1]);
      if(storeId){
         materials = materials.filter(
          (material) =>
            material.knowledgeStore === null ||
            material.knowledgeStore.id == storeId,
        );
      }
    }

    if (role === 'user') {
      materials = materials.filter(
        (material) => !material.account || material.account?.role?.id !== 1,
      );
    } else {
      materials = materials.filter(
        (material) => material.account?.role?.id === 1,
      );
    }

    return materials;
  }

  async getDetailMaterial(id: number) {
    return await this.materialRepository.findOne({
      where: { id },
      relations: [
        'knowledgeStore',
        'materialType',
        'accessLevel',
        'account',
        'account.role',
      ],
    });
  }

  async syncUserMaterial(id: number) {
    await this.materialRepository.update(id, { account: {id: 1} });
  }

  async saveMaterial(materialInfo: any) {
    await this.materialRepository.save(materialInfo);
  }

  async updateMaterial(
    id: number,
    name: string,
    description: string,
    text: string,
    url: string,
  ) {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['materialType'],
    });
    const updatedData = { name, description, updatedAt: new Date() };
    if (material?.materialType.id === 2) {
      updatedData['text'] = text;
    } else if (material?.materialType.id === 3) {
      updatedData['url'] = url;
    }
    await this.materialRepository.update(id, updatedData);
    return await this.materialRepository.findOne({
      where: { id },
      relations: ['knowledgeStore', 'materialType', 'accessLevel'],
    });
  }

  async changeStatus(id: number, status: boolean) {
    await this.materialRepository.update(id, { isActive: status });
    return await this.materialRepository.findOne({ where: { id } });
  }

  async getAllMaterialsByStore() {
    const materials = await this.materialRepository.find({
      relations: ['knowledgeStore'],
    });

    const validMaterials = materials.filter(
      (material) => material.knowledgeStore !== null,
    );

    const groupedMaterials = validMaterials.reduce<StoreGroup[]>(
      (acc, material) => {
        const storeId = material.knowledgeStore?.id;
        const storeName = material.knowledgeStore?.name;
        const storeDesc = material.knowledgeStore?.description;

        if (!storeId || !storeName) return acc;

        let store = acc.find((item) => item.storeId === storeId);

        if (store) {
          store.materials.push(`${material.name}_${material.id}`);
        } else {
          acc.push({
            materials: [`${material.name}_${material.id}`],
            storeId,
            storeName,
            storeDesc: storeDesc || '',
          });
        }

        return acc;
      },
      [],
    );
    return groupedMaterials;
  }

  async deleteMaterial(id: number) {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['materialType', 'knowledgeStore'],
    });

    if (material?.materialType.id === 1) {
      await this.deleteFilesFromDrive([material.url]);
    }
    await this.materialRepository.delete(id);
  }
}
