import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../interfaces/message.interface';
import { CreateMessageDto } from '../dto/create-message.dto';
import { Conversation } from '../interfaces/conversation.interface';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('Conversation')
    private readonly conversationModel: Model<Conversation>,
  ) {}

  // Create a new message
  async createMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const { conversationId, senderId, text } = createMessageDto;

    // Validate input
    if (!conversationId || !senderId || !text) {
      throw new BadRequestException(
        'conversationId, senderId, and text are required to create a message.',
      );
    }

    // Check if the conversation exists
    const conversation = await this.conversationModel
      .findById(conversationId)
      .exec();
    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found.`,
      );
    }

    // Create and save the message
    const message = new this.messageModel(createMessageDto);
    try {
      const savedMessage = await message.save();
      this.logger.log(`Message created: ${savedMessage._id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error('Failed to create message', error.stack);
      throw new Error('Failed to create message: ' + error.message);
    }
  }

  // Retrieve all messages in a conversation
  async findMessagesByConversation(conversationId: string): Promise<Message[]> {
    try {
      console.log(`Fetching messages for conversation ID: ${conversationId}`);

      // Find messages for the specified conversation ID and sort by creation time
      const messages = await this.messageModel
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .exec();

      // Log if no messages found
      if (!messages || messages.length === 0) {
        this.logger.warn(
          `No messages found for conversation ID: ${conversationId}`,
        );
        return [];
      }

      this.logger.log(
        `Messages retrieved for conversation ID: ${conversationId}`,
      );
      return messages;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve messages for conversation ID: ${conversationId}`,
        error.stack,
      );
      throw new Error('Failed to retrieve messages: ' + error.message);
    }
  }
}
