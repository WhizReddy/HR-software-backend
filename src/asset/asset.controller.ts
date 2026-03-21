import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { AssetType } from 'src/common/schema/asset.schema';

@Roles(Role.ADMIN, Role.HR)
@Controller('asset')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetService.create(createAssetDto);
  }

  @Get()
  findAll(
    @Query('availability') availability: string = '',
    @Query('search') search: string = '',
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.assetService.findAll(page, limit, availability, search);
  }

  @Get('user')
  findAllWithUsers(
    @Query('search') search: string = '',
    @Query('users') users: string = 'all',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    return this.assetService.getAllUserWithAssets(search, users, page, limit);
  }

  @Roles(Role.ADMIN, Role.HR, Role.DEV, Role.PM)
  @Get('user/:id')
  findUserAssets(@Param('id') id: string, @Req() req: any) {
    const requester = req['user'];
    const hasElevatedAccess =
      requester?.role === Role.ADMIN || requester?.role === Role.HR;

    if (!hasElevatedAccess && requester?.sub !== id) {
      throw new ForbiddenException('You can only view your own assets');
    }

    return this.assetService.getUserAssets(id);
  }

  @Get('sn/:serialNumber')
  findBySerialNumber(@Param('serialNumber') serialNumber: string) {
    return this.assetService.getAssetBySerialNumber(serialNumber);
  }

  @Get('type')
  findAllWithType() {
    return AssetType;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetService.remove(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string) {
    return this.assetService.getAssetHistory(id);
  }
}
