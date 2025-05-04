import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLevel } from 'src/entities/accessLevel.entity';
import { AccessLevelService } from './accessLevel.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccessLevel])],
    providers: [AccessLevelService],
  exports: [AccessLevelService]
})
export class AccessLevelModule {}
