import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { CreateMessageDto } from '../dto/create-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async createConversationAndMessage(
    @Body()
    body: {
      conversation: CreateConversationDto;
      message?: CreateMessageDto;
    },
  ) {
    const { conversation, message } = body;

    // If no message details are provided, just create the conversation
    if (!message) {
      return this.conversationsService.createConversation(conversation);
    }

    // If message details are provided, create both conversation and the first message
    return this.conversationsService.createConversationAndFirstMessage(
      conversation,
      message,
    );
  }

  // Get all conversations
  @Get()
  async findAll() {
    return this.conversationsService.findAll();
  }

  // Get a conversation by ID
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.conversationsService.findById(id);
  }

  // Get all conversations by user ID
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.conversationsService.findByUser(userId);
  }

  // Get all messages for a specific conversation
  @Get(':conversationId/messages')
  async findMessagesByConversation(
    @Param('conversationId') conversationId: string,
  ) {
    console.log(`Fetching messages for conversation ID: ${conversationId}`);
    return this.conversationsService.findMessagesByConversation(conversationId);
  }
}
