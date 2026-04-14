import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Conversation } from './interfaces/conversation.interface';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './interfaces/message.interface';

const getAllowedOrigins = () =>
  new Set(
    [process.env.FRONT_URL, process.env.CORS_ORIGINS]
      .filter(Boolean)
      .flatMap((value) =>
        (value ?? '')
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean),
      )
      .concat([
        'http://localhost:3000',
        'http://localhost:4173',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:5173',
      ]),
  );

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const normalizedOrigin = origin?.replace(/\/+$/, '');
      const allowedOrigins = getAllowedOrigins();

      if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Handle new client connections
  handleConnection(_client: Socket) {}

  // Handle client disconnections
  handleDisconnect(_client: Socket) {}

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      client.join(roomId);
      client.emit('joinRoomAck', { status: 'ok' });
    } catch (error) {
      console.error(`Error joining room ${roomId}:`, error);
      client.emit('joinRoomAck', { status: 'error', error: error.message });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      client.leave(roomId);
      client.emit('leaveRoomAck', { status: 'ok' });
    } catch (error) {
      console.error(`Error leaving room ${roomId}:`, error);
      client.emit('leaveRoomAck', { status: 'error', error: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const savedMessage =
        await this.messagesService.createMessage(createMessageDto);

      // Broadcast the message to the conversation room
      this.server
        .to(createMessageDto.conversationId)
        .emit('receiveMessage', savedMessage);

      // Acknowledge message sent successfully
      client.emit('sendMessageAck', { status: 'ok' });
    } catch (error) {
      console.error('Error sending message:', error);
      client.emit('sendMessageAck', { status: 'error', error: error.message });
    }
  }

  // Listen for conversation.created event
  @OnEvent('conversation.created')
  handleConversationCreated(payload: {
    conversation: Conversation;
    message?: Message;
  }) {
    const { conversation } = payload;
    const participantIds = conversation.participants;

    participantIds.forEach((participantId) => {
      this.server.to(participantId).emit('newConversation', conversation);
      // Removed the following line:
      // this.server.to(participantId).emit('joinRoom', conversation._id);
    });
  }
}
