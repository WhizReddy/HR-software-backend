import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';

@Controller('rating')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async createRating(@Body() createRatingDto: CreateRatingDto) {
    await this.ratingsService.createRatingForTeamMember(createRatingDto);
  }
  @Roles(Role.HR, Role.PM)
  @Patch(':id')
  async updateRating(
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    return this.ratingsService.updateRating(id, updateRatingDto);
  }

  @Get('user/:id')
  findByUserId(@Param('id') id: string, @Query('pmId') pmId: string) {
    return this.ratingsService.findByUser(id, pmId);
  }
}
