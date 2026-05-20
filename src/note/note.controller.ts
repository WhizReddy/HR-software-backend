import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { NoteService } from './note.service';
import { Note } from '../common/schema/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { Request } from 'express';

type RequestUser = {
  sub: string;
  role?: Role | string;
};

type RequestWithUser = Request & {
  user?: RequestUser;
};

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  create(
    @Body() createNoteDto: CreateNoteDto,
    @Req() req: RequestWithUser,
  ): Promise<Note> {
    const requester = req.user;
    const canCreateForOthers = this.hasElevatedAccess(requester);

    return this.noteService.create({
      ...createNoteDto,
      userId:
        canCreateForOthers && createNoteDto.userId
          ? createNoteDto.userId
          : requester?.sub,
    });
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get()
  findAll(): Promise<Note[]> {
    return this.noteService.findAll();
  }

  @Get('user/:userId')
  findAllByUserAndDate(
    @Param('userId') userId: string,
    @Query('date') date: string,
    @Req() req: RequestWithUser,
  ): Promise<Note[]> {
    this.assertCanAccessUser(userId, req.user);
    return this.noteService.getNotesByDate(userId, date);
  }

  @Get('user/:userId/all')
  findAllByUser(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<Note[]> {
    this.assertCanAccessUser(userId, req.user);
    return this.noteService.findAllByUser(userId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Note> {
    const note = await this.noteService.findOne(id);
    this.assertCanAccessUser(note.userId, req.user);
    return note;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req: RequestWithUser,
  ): Promise<Note> {
    const note = await this.noteService.findOne(id);
    this.assertCanAccessUser(note.userId, req.user);
    return this.noteService.update(id, updateNoteDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Note> {
    const note = await this.noteService.findOne(id);
    this.assertCanAccessUser(note.userId, req.user);
    return this.noteService.remove(id);
  }

  private hasElevatedAccess(requester?: RequestUser): boolean {
    return requester?.role === Role.ADMIN || requester?.role === Role.HR;
  }

  private assertCanAccessUser(userId: unknown, requester?: RequestUser) {
    if (!requester?.sub) {
      throw new ForbiddenException('You are not allowed to access these notes');
    }

    if (this.hasElevatedAccess(requester)) {
      return;
    }

    if (String(userId) !== String(requester.sub)) {
      throw new ForbiddenException('You can only access your own notes');
    }
  }
}
