import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MaterialDTO } from 'src/DTO/material/material.dto';
import { Material } from 'src/entities/material.entity';
import { Repository } from 'typeorm';
import { GoogleDriveService } from '../googleDrive/googleDrive.service';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async addMaterial(data: MaterialDTO, file) {
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

    if (Number(data.materialTypeId) === 1) {
      if (file) {
        const folderId =
          await this.googleDriveService.createAndShareFolder('MyUploads');
        const urlFile = await this.googleDriveService.uploadToDrive(
          file,
          folderId,
        );
        materialData['url'] = urlFile;
        materialData['name'] = file.originalname;
        materialData['description'] = file.originalname;
      }
    }
    return await this.materialRepository.save(materialData);
  }
}
