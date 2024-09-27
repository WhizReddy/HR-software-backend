import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model, PipelineStage } from 'mongoose';
import { Asset, AssetHistory } from '../common/schema/asset.schema';
import { AssetStatus } from '../common/enum/asset.enum';
import { User } from '../common/schema/user.schema';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { DateTime } from 'luxon';
import { aggregatePaginate, paginate } from 'src/common/util/pagination';

@Injectable()
export class AssetService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    try {
      await this.validateAssetData(createAssetDto);
      await this.checkType(createAssetDto.type);
      await this.checkSerialNumber(createAssetDto.serialNumber);
      const createdAsset = new this.assetModel(createAssetDto);
      createdAsset.history = [];
      return await createdAsset.save();
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  checkType(type: string) {
    if (!AssetType.includes(type)) {
      AssetType.push(type);
    }
  }

  async findAll(
    page: number,
    limit: number,
    availability: string,
  ): Promise<Asset[]> {
    try {
      const filter: FilterQuery<Asset> = {
        isDeleted: false,
      };
      if (Object.values(AssetStatus).includes(availability as AssetStatus)) {
        filter.status = availability;
      }
      if (!page && !limit) {
        return this.assetModel
          .find(filter)
          .populate('userId', 'firstName lastName imageUrl');
      }
      const populate = {
        path: 'userId',
        select: 'firstName lastName imageUrl',
      };
      const sort = { createdAt: -1 };
      return paginate(page, limit, this.assetModel, filter, sort, populate);
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  async findOne(id: string): Promise<Asset> {
    try {
      const asset = await this.assetModel
        .findById(id)
        .populate('userId', 'firstName lastName');
      if (!asset || asset.isDeleted) {
        throw new NotFoundException(`Asset with id ${id} not found`);
      }
      return asset;
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    try {
      const existingAsset = await this.assetModel.findById(id);
      if (!existingAsset) {
        throw new NotFoundException(`Asset with id ${id} not found`);
      }
      await this.validateAssetData(updateAssetDto, existingAsset);
      if (updateAssetDto.serialNumber) {
        await this.checkSerialNumber(updateAssetDto.serialNumber, id);
      }

      await this.validateHistoryData(updateAssetDto, existingAsset);
      await this.assetModel.findByIdAndUpdate(
        id,
        {
          ...updateAssetDto,
        },
        { new: true },
      );
      return await this.assetModel.findById(id);
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  async validateHistoryData(
    updateAssetDto: UpdateAssetDto,
    existingAsset: mongoose.Document<unknown, object, Asset> &
      Asset & { _id: mongoose.Types.ObjectId },
  ) {
    const now = DateTime.now();

    if (!existingAsset.history) {
      existingAsset.history = [];
    }

    let takenDate;

    if (updateAssetDto.takenDate) {
      takenDate = DateTime.fromISO(
        updateAssetDto.takenDate.toString(),
      ).toJSDate();
    } else if (existingAsset.takenDate) {
      takenDate = DateTime.fromJSDate(existingAsset.takenDate).toJSDate();
    } else {
      throw new ConflictException(
        'Taken date is required for assigned assets.',
      );
    }

    if (updateAssetDto.status === AssetStatus.ASSIGNED) {
      const updateUser = await this.userModel.findById(updateAssetDto.userId);
      if (!updateUser) {
        throw new NotFoundException(
          `User with id ${updateAssetDto.userId} not found`,
        );
      }

      const newHistoryEntry: AssetHistory = {
        updatedAt: now.toJSDate(),
        takenDate: takenDate,
        returnDate: null,
        user: {
          _id: updateUser._id,
          firstName: updateUser.firstName,
          lastName: updateUser.lastName,
        },
        status: updateAssetDto.status,
      };

      existingAsset.history.push(newHistoryEntry);
      Object.assign(updateAssetDto, {
        history: existingAsset.history,
      });
    } else if (
      (updateAssetDto.status === AssetStatus.AVAILABLE ||
        updateAssetDto.status === AssetStatus.BROKEN) &&
      existingAsset.history.length > 0
    ) {
      const lastHistoryEntry = existingAsset.history.pop();

      const newHistoryEntry: AssetHistory = {
        updatedAt: now.toJSDate(),
        takenDate: lastHistoryEntry.takenDate,
        returnDate: updateAssetDto.returnDate,
        user: lastHistoryEntry.user,
        status: updateAssetDto.status,
      };

      existingAsset.history.push(newHistoryEntry);
      Object.assign(updateAssetDto, {
        history: existingAsset.history,
      });
    } else {
      throw new ConflictException(
        'Cannot update history; asset has no previous history entries.',
      );
    }
  }
  async remove(id: string): Promise<Asset> {
    try {
      const asset = await this.assetModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true },
      );
      if (!asset) {
        throw new NotFoundException(`Asset with id ${id} not found`);
      }

      return asset;
    } catch (error) {
      throw new ConflictException(error);
    }
  }
  async getAssetHistory(id: string): Promise<AssetHistory[]> {
    const asset = await this.assetModel.findById(id);
    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} not found`);
    }
    return asset.history;
  }
  private async validateAssetData(
    assetData: CreateAssetDto | UpdateAssetDto,
    existingAsset?: Asset,
  ) {
    if (assetData.userId) {
      const userExists = await this.userModel.findById(assetData.userId);
      if (!userExists) {
        throw new NotFoundException(
          `User with id ${assetData.userId} not found`,
        );
      }
      assetData.userId = new mongoose.Types.ObjectId(assetData.userId);
    }
    if (!assetData.userId && assetData.status === AssetStatus.ASSIGNED) {
      throw new ConflictException(
        `Asset with status ${assetData.status} must have a user`,
      );
    }
    if (!assetData.status && assetData.userId) {
      assetData.status = AssetStatus.ASSIGNED;
    }
    if (assetData.userId && assetData.status !== AssetStatus.ASSIGNED) {
      throw new ConflictException(
        `Asset with user must have status ${AssetStatus.ASSIGNED}`,
      );
    }
    if (assetData.userId && !assetData.takenDate) {
      throw new ConflictException(`Asset with user must have a takenDate date`);
    }
    if (assetData.returnDate && !existingAsset.takenDate) {
      throw new ConflictException(`Asset must have a takenDate date first`);
    }
    if (
      assetData.returnDate &&
      existingAsset.takenDate &&
      DateTime.fromJSDate(new Date(existingAsset.takenDate)) >
        DateTime.fromJSDate(new Date(assetData.returnDate))
    ) {
      throw new ConflictException(
        'Return date cannot be before the taken date',
      );
    }
  }
  private async checkSerialNumber(
    serialNumber: string,
    excludeId?: string,
  ): Promise<void> {
    const query = { serialNumber };
    if (excludeId) {
      Object.assign(query, { _id: { $ne: excludeId } });
    }
    const existingAsset = await this.assetModel.findOne(query);
    if (existingAsset) {
      throw new ConflictException('Serial number must be unique');
    }
  }

  async getAllUserWithAssets(
    search: string,
    users: string,
    page: number,
    limit: number,
  ): Promise<any> {
    let objectToPassToMatch: FilterQuery<any> =
      users === 'with'
        ? {
            assets: { $ne: [] },
          }
        : users === 'without'
          ? {
              assets: { $eq: [] },
            }
          : {};

    if (search) {
      objectToPassToMatch = {
        ...objectToPassToMatch,
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ],
      };
    }

    try {
      const aggregationPipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'assets',
            localField: '_id',
            foreignField: 'userId',
            as: 'assets',
          },
        },
        {
          $lookup: {
            from: 'auths',
            localField: 'auth',
            foreignField: '_id',
            as: 'authData',
          },
        },
        {
          $unwind: {
            path: '$authData',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            ...objectToPassToMatch,
          },
        },
        {
          $sort: {
            firstName: 1,
            lastName: 1,
          },
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            imageUrl: 1,
            phone: 1,
            assets: 1,
            role: 1,
            email: '$authData.email',
          },
        },
      ];

      const paginatedResults = await aggregatePaginate(
        page,
        limit,
        this.userModel,
        objectToPassToMatch,
        aggregationPipeline,
      );

      return paginatedResults;
    } catch (err) {
      throw new ConflictException(err);
    }
  }

  async getAssetBySerialNumber(serialNumber: string): Promise<Asset> {
    const asset = await this.assetModel
      .findOne({ serialNumber })
      .populate('userId', 'firstName lastName imageUrl');
    if (!asset) {
      throw new NotFoundException(
        `Asset with serial number ${serialNumber} not found`,
      );
    }
    return asset;
  }
}
