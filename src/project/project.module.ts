import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project, ProjectSchema } from '../common/schema/project.schema';
import { User, UserSchema } from 'src/common/schema/user.schema';
import { RatingsModule } from 'src/ratings/ratings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => RatingsModule),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [MongooseModule, ProjectService],
})
export class ProjectModule {}
