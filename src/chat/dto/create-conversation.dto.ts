import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsArray() // Ensure it's an array
  @ArrayNotEmpty() // Ensure the array is not empty
  @IsString({ each: true }) // Ensure each item in the array is a string
  readonly participants: string[];
}
