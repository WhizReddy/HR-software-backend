import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { NoteService } from './note.service';
import { Note } from '../common/schema/note.schema';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  create(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
    return this.noteService.create(createNoteDto);
  }

  @Get()
  findAll(): Promise<Note[]> {
    return this.noteService.findAll();
  }
  @Get('user/:userId')
  findAllByUserAndDate(
    @Param('userId') userId: string,
    @Query('date') date: string,
  ): Promise<Note[]> {
    return this.noteService.getNotesByDate(userId, date);
  }

  @Get('user/:userId/all')
  findAllByUser(@Param('userId') userId: string): Promise<Note[]> {
    return this.noteService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Note> {
    return this.noteService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<Note> {
    return this.noteService.update(id, updateNoteDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<Note> {
    return this.noteService.remove(id);
  }
}
