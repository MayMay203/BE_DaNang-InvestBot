import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class MaterialDTO {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  knowledgeStoreId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsDate()
  createdAt: Date | undefined;

  @IsOptional()
  @IsDate()
  updatedAt: Date | undefined;

  @IsString()
  accessLevelId: string;

  @IsString()
  materialTypeId: string;
}
