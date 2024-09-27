import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { Poll, Event } from '../common/schema/event.schema';
import { VoteDto } from './dto/vote.dto';
import { User } from '../common/schema/user.schema';
import { Auth } from '../common/schema/auth.schema';
import { DateTime } from 'luxon';

async function validateData(
  eventModel: Model<Event>,
  userModel: Model<User>,
  id: string,
  vote: VoteDto,
): Promise<void> {
  const event = await eventModel.findById(id as unknown as Types.ObjectId);

  if (!event) {
    throw new NotFoundException(`Event with id ${id} not found`);
  }

  const now = DateTime.now();
  const eventStartDate = DateTime.fromISO(event.startDate.toString());

  if (eventStartDate <= now) {
    throw new BadRequestException('Event date has passed');
  }

  const user = await userModel.findById(vote.userId);
  if (!user) {
    throw new NotFoundException(`User with id ${vote.userId} not found`);
  }

  if (!event.poll || !event.poll.options) {
    throw new BadRequestException('This event does not have a poll');
  }
}

function validatePollData(poll: Poll) {
  if (typeof poll === 'string') {
    poll = JSON.parse(poll);
  }

  if (typeof poll !== 'object' || poll === null) {
    throw new BadRequestException('Invalid poll data');
  }
  if (!poll.question || poll.question.length === 0) {
    throw new BadRequestException('Poll question cannot be empty');
  }

  if (!Array.isArray(poll.options) || poll.options.length <= 1) {
    throw new BadRequestException('Poll options must be more than one');
  }

  if (poll.options.length > 3) {
    throw new BadRequestException('Poll options must be 3 or 2');
  }

  if (poll.options.some((opt) => !opt.option || opt.option.length <= 1)) {
    throw new BadRequestException(
      'Poll option cannot be less than 1 character',
    );
  }

  for (let i = 0; i < poll.options.length; i++) {
    for (let j = i + 1; j < poll.options.length; j++) {
      if (poll.options[i].option === poll.options[j].option) {
        throw new BadRequestException('Poll options must be unique');
      }
    }
  }

  return poll;
}
async function getAllParticipants(
  userModel: Model<User>,
  authModel: Model<Auth>,
) {
  const emails: string[] = [];
  const users = await userModel.find();
  const userIds = users.map((user) => user._id);
  for (const userId of userIds) {
    const user = await userModel
      .findById(userId)
      .populate('auth', 'email')
      .select('auth');
    const auth = await authModel.findById(user.auth);
    emails.push(auth.email);
  }
  return emails;
}

function validateDate(startDate?: string, endDate?: string): void {
  if (startDate && endDate) {
    const start = DateTime.fromISO(startDate);
    const end = DateTime.fromISO(endDate);
    const now = DateTime.now();

    if (end < start) {
      throw new BadRequestException(
        'End date must be after or the same as the start date',
      );
    }

    if (start <= now) {
      throw new BadRequestException('Event date has passed');
    }
  }
}

async function getParticipantsByUserId(
  userModel: Model<User>,
  authModel: Model<Auth>,
  participants: string[],
): Promise<Types.ObjectId[]> {
  const userIds: Types.ObjectId[] = [];
  for (let i = 0; i < participants.length; i++) {
    const auth = await authModel.findOne({ email: participants[i] });
    const user = await userModel.findOne({ auth: auth._id });
    if (!user) {
      throw new NotFoundException(
        `User with email ${participants[i]} not found`,
      );
    }
    userIds.push(user._id);
  }
  return userIds;
}

export {
  validateData,
  validatePollData,
  getAllParticipants,
  validateDate,
  getParticipantsByUserId,
};
