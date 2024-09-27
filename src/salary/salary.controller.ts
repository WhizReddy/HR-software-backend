import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';

@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Roles(Role.HR)
  @Post()
  create(@Body() createSalaryDto: CreateSalaryDto) {
    return this.salaryService.create(createSalaryDto);
  }

  @Get()
  find(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('maxNetSalary') maxNetSalary?: number,
    @Query('minNetSalary') minNetSalary?: number,
    @Query('workingDays') workingDays?: number,
    @Query('bonus') bonus?: number,
    @Query('fullName') fullName?: string,
  ) {
    return this.salaryService.findAll(
      page,
      limit,
      month,
      year,
      maxNetSalary,
      minNetSalary,
      workingDays,
      bonus,
      fullName,
    );
  }
  @Get('user/:id')
  findByUserId(
    @Param('id') id: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('graf') graf: boolean,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.salaryService.findByUserId(page, limit, id, month, year, graf);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salaryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto) {
    return this.salaryService.update(id, updateSalaryDto);
  }
}
