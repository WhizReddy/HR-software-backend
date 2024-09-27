import { Injectable } from '@nestjs/common';
import { MessagesService } from './services/messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private readonly messagesService: MessagesService) {}

  async saveMessage(createMessageDto: CreateMessageDto) {
    return await this.messagesService.createMessage(createMessageDto);
  }
}
