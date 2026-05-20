import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { User } from '../common/schema/user.schema';
import { Auth } from '../common/schema/auth.schema';
import { DateTime } from 'luxon';

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

    if (start.plus({ minutes: 5 }) <= now) {
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
  getAllParticipants,
  validateDate,
  getParticipantsByUserId,
};
