import { IsNumber, IsString } from 'class-validator';

export class QueryDTO {
  @IsNumber()
  conversationId: number;

  @IsString()
  query: string;
}
