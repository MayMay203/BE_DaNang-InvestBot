import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}
  async seedRolesIfEmpty() {
    const count = await this.roleRepository.count();
    if (count > 0) return;

    const roles = ['admin', 'user', 'employee'];
    await this.roleRepository.save(roles.map((name) => ({ name })));
  }
}
