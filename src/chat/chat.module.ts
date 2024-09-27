import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from './chat.gateway';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { ConversationSchema } from './schemas/conversation.schema';
import { MessageSchema } from './schemas/message.schema';
import { ConversationsController } from './controllers/conversations.controller';
import { MessagesController } from './controllers/messages.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
      { name: 'Message', schema: MessageSchema },
    ]),
    EventEmitterModule.forRoot(),
  ],
  providers: [ChatGateway, ConversationsService, MessagesService],
  controllers: [ConversationsController, MessagesController],
  exports: [ConversationsService, MessagesService],
})
export class ChatModule {}
