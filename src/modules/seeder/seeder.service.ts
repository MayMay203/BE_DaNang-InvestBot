import { Injectable, OnModuleInit } from '@nestjs/common';
import { RoleService } from '../role/role.service';
import { AccessLevelService } from '../accessLevel/accessLevel.service';
import { MaterialTypeService } from '../materialType/materialType.service';
import { AuthService } from '../auth/auth.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(
    private readonly roleService: RoleService,
    private readonly accessLevelService: AccessLevelService,
    private readonly materialTypeService: MaterialTypeService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  async onModuleInit() {
    await this.roleService.seedRolesIfEmpty();
    await this.materialTypeService.seedMaterialTypeIfEmpty();
    await this.accessLevelService.seedAccessIfEmpty();
    await this.authService.addDefaultAdminAcc();
  }
}
