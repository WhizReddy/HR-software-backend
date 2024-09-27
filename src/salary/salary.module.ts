import { Module } from '@nestjs/common';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Salary, SalarySchema } from 'src/common/schema/salary.schema';
import { User, UserSchema } from 'src/common/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Salary.name, schema: SalarySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SalaryController],
  providers: [SalaryService],
})
export class SalaryModule {}
