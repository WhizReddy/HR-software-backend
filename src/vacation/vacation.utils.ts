import { DateTime } from 'luxon';
import { ConflictException, NotFoundException } from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { User } from 'src/common/schema/user.schema';
import { Vacation } from 'src/common/schema/vacation.schema';
export function isDateRangeOverlapping(
  start1: DateTime,
  end1: DateTime,
  start2: DateTime,
  end2: DateTime,
): boolean {
  return start1 <= end2 && start2 <= end1;
}

async function checkRequestUser(userModel: Model<User>, req: Request) {
  const userId = req['user'].sub;
  const userExists = await userModel.findById(userId);
  if (!userExists) {
    throw new NotFoundException(`User with id ${userId} not found`);
  }
  return new Types.ObjectId(userId);
}
async function checkUserId(userModel: Model<User>, userId: string) {
  const userExists = await userModel.findById(userId);
  if (!userExists) {
    throw new NotFoundException(`User with id ${userId} not found`);
  }
}

async function checkDatesforUpdate(
  vacationModel: Model<Vacation>,
  updateVacationDto: UpdateVacationDto,
  id: string,
) {
  const existingVacation = await vacationModel.findById(id);
  if (!existingVacation) {
    throw new NotFoundException(`Vacation with id ${id} not found`);
  }

  const startDate = updateVacationDto.startDate
    ? DateTime.fromISO(updateVacationDto.startDate.toString())
    : DateTime.fromJSDate(existingVacation.startDate);
  const endDate = updateVacationDto.endDate
    ? DateTime.fromISO(updateVacationDto.endDate.toString())
    : DateTime.fromJSDate(existingVacation.endDate);
  const today = DateTime.now();

  if (startDate <= today) {
    throw new ConflictException(
      `Start date ${startDate.toISODate()} must be greater than today ${today.toISODate()}`,
    );
  }

  if (endDate < startDate) {
    throw new ConflictException(
      `End date ${endDate.toISODate()} must be greater than start date ${startDate.toISODate()}`,
    );
  }

  const conflictingVacation = await vacationModel.aggregate([
    {
      $match: {
        userId: existingVacation.userId,
        endDate: { $gt: today.toJSDate() },
      },
    },
    {
      $sort: { endDate: -1 },
    },
  ]);

  for (const vacation of conflictingVacation) {
    const vacationStart = DateTime.fromJSDate(vacation.startDate);
    const vacationEnd = DateTime.fromJSDate(vacation.endDate);

    if (
      vacation._id.toString() !== id &&
      isDateRangeOverlapping(startDate, endDate, vacationStart, vacationEnd)
    ) {
      throw new ConflictException(
        `New vacation conflicts with an existing vacation from ${vacationStart.toISODate()} to ${vacationEnd.toISODate()}`,
      );
    }
  }
}

async function checkDatesforCreate(
  vacationModel: Model<Vacation>,
  vacationData: CreateVacationDto | UpdateVacationDto,
) {
  const startDate = DateTime.fromISO(vacationData.startDate.toString());
  const endDate = DateTime.fromISO(vacationData.endDate.toString());
  const today = DateTime.now();

  if (startDate <= today) {
    throw new ConflictException(
      `Start date ${startDate.toISODate()} must be greater than today ${today.toISODate()}`,
    );
  }

  if (endDate < startDate) {
    throw new ConflictException(
      `End date ${endDate.toISODate()} must be greater than start date ${startDate.toISODate()}`,
    );
  }

  const conflictingVacation = await vacationModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(vacationData.userId),
      },
    },
  ]);

  for (const vacation of conflictingVacation) {
    const vacationStart = DateTime.fromJSDate(vacation.startDate);
    const vacationEnd = DateTime.fromJSDate(vacation.endDate);

    if (
      isDateRangeOverlapping(startDate, endDate, vacationStart, vacationEnd)
    ) {
      throw new ConflictException(
        `New vacation conflicts with an existing vacation from ${vacationStart.toISODate()} to ${vacationEnd.toISODate()}`,
      );
    }
  }
}

export {
  checkRequestUser,
  checkUserId,
  checkDatesforUpdate,
  checkDatesforCreate,
};
