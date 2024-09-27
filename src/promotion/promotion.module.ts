import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { Promotion, PromotionSchema } from 'src/common/schema/promotion.schema';
import { User, UserSchema } from 'src/common/schema/user.schema';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationModule,
  ],
  controllers: [PromotionController],
  providers: [PromotionService],
})
export class PromotionModule {}
