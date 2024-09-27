import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Create a new message
  @Post()
  async create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.createMessage(createMessageDto);
  }

  // Get all messages for a conversation
  @Get(':conversationId')
  async findByConversation(@Param('conversationId') conversationId: string) {
    return this.messagesService.findMessagesByConversation(conversationId);
  }
}
