import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { Rating, RatingSchema } from 'src/common/schema/rating.schema';
import { Project, ProjectSchema } from 'src/common/schema/project.schema';
import { User, UserSchema } from 'src/common/schema/user.schema';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => ProjectModule),
  ],
  providers: [RatingsService],
  controllers: [RatingsController],
  exports: [MongooseModule, RatingsService],
})
export class RatingsModule {}
