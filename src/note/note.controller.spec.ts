import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Role } from '../common/enum/role.enum';
import { Note } from '../common/schema/note.schema';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

jest.mock('mongoose-unique-validator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('NoteController authorization', () => {
  const ownerId = new Types.ObjectId();
  const otherUserId = new Types.ObjectId();
  const noteId = new Types.ObjectId().toString();
  const note = {
    _id: noteId,
    title: 'Reminder',
    description: 'Follow up',
    userId: ownerId,
    isDeleted: false,
  } as unknown as Note;

  let controller: NoteController;
  let noteService: jest.Mocked<
    Pick<NoteService, 'create' | 'findOne' | 'update' | 'remove'>
  >;

  beforeEach(() => {
    noteService = {
      create: jest.fn(),
      findOne: jest.fn().mockResolvedValue(note),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new NoteController(noteService as unknown as NoteService);
  });

  it('allows a user to read their own note', async () => {
    await expect(
      controller.findOne(noteId, {
        user: { sub: ownerId.toString(), role: Role.DEV },
      } as any),
    ).resolves.toBe(note);
  });

  it("blocks a user from reading another user's note", async () => {
    await expect(
      controller.findOne(noteId, {
        user: { sub: otherUserId.toString(), role: Role.DEV },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows HR to read another user's note", async () => {
    await expect(
      controller.findOne(noteId, {
        user: { sub: otherUserId.toString(), role: Role.HR },
      } as any),
    ).resolves.toBe(note);
  });

  it('forces created notes onto the JWT user for non-HR users', async () => {
    const createDto = {
      title: 'Private',
      description: 'Only mine',
      userId: otherUserId.toString(),
      willBeReminded: false,
    };

    noteService.create.mockResolvedValue(note);

    await controller.create(createDto, {
      user: { sub: ownerId.toString(), role: Role.DEV },
    } as any);

    expect(noteService.create).toHaveBeenCalledWith({
      ...createDto,
      userId: ownerId.toString(),
    });
  });
});
