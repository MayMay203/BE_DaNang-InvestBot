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
  name?: string | string;

  @IsOptional()
  @IsString()
  description?: string | undefined;

  @IsOptional()
  @IsString()
  text?: string | undefined;

  @IsOptional()
  @IsString()
  url?: string | undefined;

  @IsOptional()
  @IsString()
  knowledgeStoreId?: string | undefined;

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
