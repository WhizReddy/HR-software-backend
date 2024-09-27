import { IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsString()
  text: string;

  @IsString()
  senderId: string;
}
