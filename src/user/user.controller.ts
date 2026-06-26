import {
  Controller,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseInterceptors,
  Post,
  UploadedFile,
  Req,
  Query,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../common/schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileMimeTypeValidationPipe } from 'src/common/pipes/file-mime-type-validation.pipe';
import { Request } from 'express';

type RequestUser = {
  sub: string;
  role?: Role | string;
};

type RequestWithUser = Request & {
  user?: RequestUser;
};

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.HR, Role.ADMIN)
  @Get()
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string = '',
    @Query('role') role: string = '',
  ): Promise<User[]> {
    return await this.userService.findAll(page, limit, search, role);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get('search/:name')
  async searchUser(@Param('name') name: string): Promise<User[]> {
    return this.userService.filterUsers(name);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get('remote/:remote')
  async findRemoteUsers(@Param('remote') remote: boolean): Promise<number> {
    return this.userService.getPresentOrRemoteUser(remote);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<User | null> {
    this.assertCanAccessUser(id, req.user);
    return await this.userService.findOne(id);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id') id: string,
  ): Promise<User> {
    return await this.userService.updateUser(updateUserDto, id);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @UsePipes(new FileMimeTypeValidationPipe({ fieldKinds: { file: 'image' } }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    return this.userService.uploadImage(file, req);
  }

  private assertCanAccessUser(userId: string, requester?: RequestUser) {
    if (!requester?.sub) {
      throw new ForbiddenException('You are not allowed to access this user');
    }

    if (requester.role === Role.ADMIN || requester.role === Role.HR) {
      return;
    }

    if (String(requester.sub) !== String(userId)) {
      throw new ForbiddenException('You can only access your own profile');
    }
  }
}
