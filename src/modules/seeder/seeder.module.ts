import { Module } from '@nestjs/common';
import { RoleModule } from '../role/role.module';
import { AccessLevelModule } from '../accessLevel/accessLevel.module';
import { AuthModule } from '../auth/auth.module';
import { SeederService } from './seeder.service';
import { MaterialTypeModule } from '../materialType/materialType.module';

@Module({
  imports: [RoleModule, AccessLevelModule, MaterialTypeModule, AuthModule],
  providers: [SeederService],
})
export class SeederModule {}
