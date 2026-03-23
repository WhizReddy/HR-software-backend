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

import { VacationService } from './vacation.service';
import { CreateVacationDto } from './dto/create-vacation.dto';
import { UpdateVacationDto } from './dto/update-vacation.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';

@Controller('vacation')
export class VacationController {
  constructor(private readonly vacationService: VacationService) {}

  @Post()
  create(@Body() createVacationDto: CreateVacationDto, @Req() req: Request) {
    return this.vacationService.create(createVacationDto, req);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('type') type: string = '',
    @Query('status') status: string = '',
    @Query('startDate') startDate: string = '',
    @Query('endDate') endDate: string = '',
    @Query('search') search: string = '',
  ) {
    return this.vacationService.findAll(
      page,
      limit,
      type,
      status,
      startDate,
      endDate,
      search,
    );
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get('user')
  findAllWithUsers(
    @Query('search') search: string = '',
    @Query('users') users: string = 'all',
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.vacationService.getAllUserVacation(page, limit, search, users);
  }

  @Get('user/:id')
  findAllWithUsersById(@Param('id') id: string, @Req() req: any) {
    const requester = req['user'];
    const hasElevatedAccess =
      requester?.role === Role.ADMIN || requester?.role === Role.HR;

    if (!hasElevatedAccess && requester?.sub !== id) {
      throw new ForbiddenException('You can only view your own vacations');
    }

    return this.vacationService.getUserVacation(id);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get('onLeave')
  findAllOnLeave() {
    return this.vacationService.getNumberOfUsersOnVacation();
  }

  @Roles(Role.HR, Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacationService.findOne(id);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVacationDto: UpdateVacationDto,
  ) {
    return this.vacationService.update(id, updateVacationDto);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vacationService.remove(id);
  }
}
