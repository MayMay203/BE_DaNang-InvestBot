import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}
  async onModuleInit() {
    this.seedRolesIfEmpty();
  }
  private async seedRolesIfEmpty() {
    const count = await this.roleRepository.count();
    if (count > 0) return;

    const roles = ['admin', 'user', 'employee'];
    await this.roleRepository.save(roles.map((name) => ({ name })));
  }
}
