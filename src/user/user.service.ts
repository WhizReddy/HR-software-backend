import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../common/schema/user.schema';
import mongoose from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { paginate } from 'src/common/util/pagination';
import { EngagementType } from 'src/common/enum/position.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: mongoose.Model<User>,
    @InjectModel('Auth')
    private authModel: mongoose.Model<any>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async findAll(page?: number, limit?: number): Promise<User[]> {
    try {
      if (!limit && !page) {
        return await this.userModel
          .find({ isDeleted: { $ne: true } })
          .populate('auth', 'email');
      }
      const filter = { isDeleted: { $ne: true } };
      const populate = { path: 'auth', select: 'email' };
      const sort = { createdAt: -1 };
      return paginate(page, limit, this.userModel, filter, sort, populate);
    } catch (err) {
      throw new ConflictException(err);
    }
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).populate('auth');
    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async updateUser(updateUserDto: UpdateUserDto, id: string): Promise<User> {
    try {
      if (updateUserDto.email) {
        const existingUser = await this.userModel.findOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        const authUser = await this.authModel.findOne({
          _id: existingUser.auth,
        });
        if (authUser.email !== updateUserDto.email) {
          const existingEmail = await this.authModel.findOne({
            email: updateUserDto.email,
          });
          if (existingEmail) {
            throw new ConflictException('Email already exists');
          } else {
            await this.authModel.updateOne(
              { _id: existingUser.auth },
              { email: updateUserDto.email },
            );
          }
        }
      }
      const updatedUser = await this.userModel.findByIdAndUpdate(
        id,
        updateUserDto,
        { new: true },
      );
      if (!updatedUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }
      return updatedUser;
    } catch (err) {
      throw new ConflictException(err);
    }
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  async uploadImage(file: Express.Multer.File, req: any): Promise<string> {
    try {
      const profileImageUrl = await this.firebaseService.uploadFile(
        file,
        'profileImages',
        'square',
      );

      await this.userModel.findByIdAndUpdate(req['user'].sub, {
        imageUrl: profileImageUrl,
      });

      return profileImageUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new ConflictException('Failed to upload file');
    }
  }

  async filterUsers(name: string): Promise<User[]> {
    try {
      const users = await this.userModel.find({
        firstName: { $regex: name, $options: 'i' },
        isDeleted: { $ne: true },
      });
      return users;
    } catch (err) {
      throw new ConflictException(err);
    }
  }

  async getPresentOrRemoteUser(isRemote: boolean): Promise<number> {
    try {
      if (isRemote) {
        return await this.userModel.countDocuments({
          engagement: {
            $in: [
              EngagementType.PART_TIME_REMOTE,
              EngagementType.FULL_TIME_REMOTE,
            ],
          },
        });
      } else {
        return await this.userModel.countDocuments({
          engagement: {
            $in: [
              EngagementType.FULL_TIME_ON_SITE,
              EngagementType.PART_TIME_ON_SITE,
            ],
          },
        });
      }
    } catch (err) {
      throw new ConflictException(err);
    }
  }
}
