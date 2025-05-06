import { IsString } from 'class-validator';

export class KnowledgeStoreDTO {
  @IsString()
  name: string;

  @IsString()
  description: string;
}
