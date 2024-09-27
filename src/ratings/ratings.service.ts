import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating } from 'src/common/schema/rating.schema';
import { Project } from 'src/common/schema/project.schema';
import { User } from 'src/common/schema/user.schema';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private readonly ratingModel: Model<Rating>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createRatingForTeamMember(
    createRatingDto: CreateRatingDto,
  ): Promise<Rating> {
    const project = await this.projectModel.findOne({
      _id: createRatingDto.projectId,
    });
    if (!project) {
      throw new BadRequestException('Project not found');
    }
    const user = await this.userModel.findOne({ _id: createRatingDto.userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const rating = new this.ratingModel(createRatingDto);
    return await rating.save();
  }
  async updateRating(id: string, updateRatingDto: UpdateRatingDto) {
    const rating = await this.ratingModel.findById(id);
    if (!rating) {
      throw new BadRequestException('Rating not found');
    }
    return await this.ratingModel.findByIdAndUpdate(id, updateRatingDto, {
      new: true,
    });
  }
  async findByUser(userId: string, pmId?: string) {
    if (pmId) {
      const projects = await this.projectModel.find({
        isDeleted: false,
        projectManager: new Types.ObjectId(pmId),
        teamMembers: { $elemMatch: { $eq: new Types.ObjectId(userId) } },
      });
      const ratings = [];
      for (const project of projects) {
        const rating = await this.ratingModel
          .find({
            isDeleted: false,
            userId: new Types.ObjectId(userId),
            projectId: project._id,
          })
          .populate('projectId', 'name');
        ratings.push(...rating);
      }
      return ratings;
    } else {
      return await this.ratingModel
        .find({ userId: new Types.ObjectId(userId), isDeleted: false })
        .populate('projectId', 'name');
    }
  }

  async deleteRatingByProjectId(id: string) {
    const rating = await this.ratingModel.find({
      projectId: new Types.ObjectId(id),
    });
    for (const rate of rating) {
      await this.ratingModel.findByIdAndUpdate(
        { _id: rate._id },
        { isDeleted: true },
      );
    }
  }
}
