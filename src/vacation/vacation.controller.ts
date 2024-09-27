import {
  Controller,
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

@Controller('vacation')
export class VacationController {
  constructor(private readonly vacationService: VacationService) {}

  @Post()
  create(@Body() createVacationDto: CreateVacationDto, @Req() req: Request) {
    return this.vacationService.create(createVacationDto, req);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('type') type: string = '',
    @Query('status') status: string = '',
    @Query('startDate') startDate: string = '',
    @Query('endDate') endDate: string = '',
  ) {
    return this.vacationService.findAll(
      page,
      limit,
      type,
      status,
      startDate,
      endDate,
    );
  }

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
  findAllWithUsersById(@Param('id') id: string) {
    return this.vacationService.getUserVacation(id);
  }

  @Get('onLeave')
  findAllOnLeave() {
    return this.vacationService.getNumberOfUsersOnVacation();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vacationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVacationDto: UpdateVacationDto,
  ) {
    return this.vacationService.update(id, updateVacationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vacationService.remove(id);
  }
}
