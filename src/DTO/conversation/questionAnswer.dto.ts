import { IsNumber, IsString } from 'class-validator';

export class QuestionAnswerDTO {
  @IsString()
  questionContent: string;

  @IsString()
  answerContent: string;

  @IsNumber()
  conversationId: number;
}
