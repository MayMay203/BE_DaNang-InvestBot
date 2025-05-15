import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialDTO } from 'src/DTO/material/material.dto';
import { Material } from 'src/entities/material.entity';
import { Repository } from 'typeorm';
import { GoogleDriveService } from '../googleDrive/googleDrive.service';

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
  ) {}

  async addMaterial(data: MaterialDTO, files: Express.Multer.File[]) {
    const results: any[] = [];

    if (Number(data.materialTypeId) === 1 && files?.length) {
      const folderId =
        await this.googleDriveService.createAndShareFolder('MyUploads');

      for (const file of files) {
        const urlFile = await this.googleDriveService.uploadToDrive(
          file,
          folderId,
        );

        const materialData = {
          name: file.originalname,
          description: file.originalname,
          text: data.text,
          url: urlFile,
          createdAt: new Date(),
          updatedAt: new Date(),
          materialType: { id: Number(data.materialTypeId) },
          accessLevel: { id: Number(data.accessLevelId) },
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

    // Nếu là loại không yêu cầu file, chỉ tạo 1 bản ghi
    const materialData = {
      name: data.name,
      description: data.description,
      text: data.text,
      url: data.url,
      createdAt: new Date(),
      updatedAt: new Date(),
      materialType: { id: Number(data.materialTypeId) },
      accessLevel: { id: Number(data.accessLevelId) },
    };

    return await this.materialRepository.save(materialData);
  }

  async getAllMaterials(store?: string) {
    let whereCondition = {};
    if (store && store != 'empty') {
      whereCondition = { knowledgeStore: { id: store } };
    }

    let materials = await this.materialRepository.find({
      where: whereCondition,
      relations: ['knowledgeStore', 'materialType', 'accessLevel'],
      order: { id: 'DESC' },
    });

    if (store === 'empty') {
      materials = materials.filter(
        (material) => material.knowledgeStore === null,
      );
    }

    return materials;
  }

  async getDetailMeterial(id: number) {
    return await this.materialRepository.find({
      where: { id },
      relations: ['knowledgeStore', 'materialType', 'accessLevel'],
    });
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
            storeDesc,
          });
        }

        return acc;
      },
      [],
    );
    return groupedMaterials;
  }
}
