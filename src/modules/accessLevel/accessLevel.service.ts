import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccessLevel } from 'src/entities/accessLevel.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccessLevelService {
  constructor(
    @InjectRepository(AccessLevel)
    private readonly accessLevelRepository: Repository<AccessLevel>,
  ) {}

  async seedAccessIfEmpty() {
    const count = await this.accessLevelRepository.count();
    if (count > 0) return;

    const accessLevels = ['public', 'private', 'internal'];
    await this.accessLevelRepository.save(
      accessLevels.map((name) => ({ name })),
    );
  }
}
