import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Applicant,
  ApplicantDocument,
} from 'src/common/schema/applicant.schema';
import { ApplicantStatus } from 'src/common/enum/applicant.enum';

@Injectable()
export class ApplicantCleanupService {
  private readonly logger = new Logger(ApplicantCleanupService.name);

  constructor(
    @InjectModel(Applicant.name)
    private applicantModel: Model<ApplicantDocument>,
  ) {}

  /**
   * Runs every hour and deletes applicants that:
   *  - are still in PENDING status (unconfirmed email)
   *  - were created more than 1 hour ago
   *
   * This replaces the fragile in-memory setTimeout that was lost on server restart.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanUpUnconfirmedApplicants(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);

    try {
      const result = await this.applicantModel.deleteMany({
        status: ApplicantStatus.PENDING,
        createdAt: { $lte: oneHourAgo },
      });

      if (result.deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${result.deletedCount} unconfirmed applicant(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to clean up unconfirmed applicants', error);
    }
  }
}
