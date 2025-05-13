import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class ChangeStatusDTO {
  @IsNumber()
  id: number;

  @IsBoolean()
  status: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
