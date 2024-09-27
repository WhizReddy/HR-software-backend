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

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    secure: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Handle new client connections
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // Handle client disconnections
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

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
      console.log(`Client ${client.id} joined room ${roomId}`);
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
      console.log(`Client ${client.id} left room ${roomId}`);
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
    console.log('Received sendMessage event:', createMessageDto);
    try {
      const savedMessage =
        await this.messagesService.createMessage(createMessageDto);
      console.log(`Message created: ${savedMessage._id}`);

      // Broadcast the message to the conversation room
      this.server
        .to(createMessageDto.conversationId)
        .emit('receiveMessage', savedMessage);
      console.log(
        `Message broadcasted to room ${createMessageDto.conversationId}`,
      );

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

    console.log(
      `Handling conversation.created event for conversation: ${conversation._id}`,
    );

    participantIds.forEach((participantId) => {
      console.log(
        `Emitting newConversation to participant: ${participantId} for conversation: ${conversation._id}`,
      );
      this.server.to(participantId).emit('newConversation', conversation);
      // Removed the following line:
      // this.server.to(participantId).emit('joinRoom', conversation._id);
    });
  }
}
