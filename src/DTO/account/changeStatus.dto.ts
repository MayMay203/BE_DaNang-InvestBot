import { IsBoolean, IsNumber } from 'class-validator';

export class ChangeStatusDTO {
  @IsNumber()
  id: number;

  @IsBoolean()
  status: boolean;
}
