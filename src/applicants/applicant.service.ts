import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { UpdateApplicantDto } from './dto/update-applicant.dto';
import {
  ApplicantPhase,
  ApplicantStatus,
  EmailType,
} from 'src/common/enum/applicant.enum';
import { MailService } from 'src/mail/mail.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import {
  Applicant,
  ApplicantDocument,
} from 'src/common/schema/applicant.schema';
import { DateTime } from 'luxon';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { NotificationService } from 'src/notification/notification.service';
import { paginate } from 'src/common/util/pagination';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Public } from 'src/common/decorator/public.decorator';
import { AuthService } from 'src/auth/auth.service';
import { NotificationType } from 'src/common/enum/notification.enum';
import { Auth } from 'src/common/schema/auth.schema';

@Injectable()
export class ApplicantsService {
  constructor(
    @InjectModel(Applicant.name)
    private applicantModel: Model<ApplicantDocument>,
    @InjectModel(Auth.name)
    private authModel: Model<Auth>,
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
    private readonly authService: AuthService,
    private readonly notificationService: NotificationService,
  ) {}

  async deleteApplicant(id: string): Promise<void> {
    const applicant = await this.findOne(id);
    if (!applicant) {
      throw new NotFoundException(`Applicant with id ${id} not found`);
    }
    applicant.isDeleted = true;
    await applicant.save();
  }
  async findAll(
    page?: number,
    limit?: number,
    currentPhase?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Applicant[]> {
    try {
      const filter: any = {};
      filter.isDeleted = false;
      filter.status = {
        $nin: [ApplicantStatus.PENDING, ApplicantStatus.EMPLOYED],
      };

      if (currentPhase) {
        filter.currentPhase = currentPhase;
      }

      if (startDate && endDate) {
        switch (currentPhase) {
          case 'first_interview':
            filter.firstInterviewDate = {
              $ne: null,
              $gte: startDate,
              $lte: endDate,
            };
            break;
          case 'second_interview':
            filter.secondInterviewDate = {
              $ne: null,
              $gte: startDate,
              $lte: endDate,
            };
            break;
          case 'createdAt':
            filter.createdAt = { $gte: startDate, $lte: endDate };
            filter.firstInterviewDate = null;
            filter.secondInterviewDate = null;
            break;
        }
      }
      if (!limit && !page) {
        return await this.applicantModel
          .find(filter)
          .sort({ createdAt: 'desc' });
      }

      return paginate(page, limit, this.applicantModel, filter, {
        createdAt: 'desc',
      });
    } catch (error) {
      console.error('Error filtering applicants:', error);
      throw new Error('Failed to filter applicants');
    }
  }

  async findOne(id: string): Promise<ApplicantDocument> {
    const applicant = await this.applicantModel.findById(id);
    if (!applicant) {
      throw new NotFoundException(`Applicant with id ${id} not found`);
    }
    return applicant;
  }

  @Public()
  async createApplicant(
    file: Express.Multer.File,
    createApplicantDto: CreateApplicantDto,
  ): Promise<Applicant> {
    try {
      const isEmployeeWithThisEmail = await this.authModel.findOne({
        email: createApplicantDto.email,
      });
      if (isEmployeeWithThisEmail) {
        throw new ConflictException('Email already exists');
      }

      const cvUrl = await this.firebaseService.uploadFile(file, 'cv');
      const confirmationToken = uuidv4();

      const applicant = await this.applicantModel.create({
        ...createApplicantDto,
        cvAttachment: cvUrl,
        status: ApplicantStatus.PENDING,
        confirmationToken,
      });

      const confirmationUrl = `${process.env.FRONT_URL}/applicant/confirm?token=${confirmationToken}`;

      await this.mailService.sendMail({
        to: createApplicantDto.email,
        subject: 'Confirm Your Application',
        template: 'successfulApplication',
        context: {
          name: createApplicantDto.firstName,
          positionApplied: createApplicantDto.positionApplied,
          confirmationUrl,
        },
      });

      setTimeout(
        async () => {
          const pendingApplicant = await this.applicantModel
            .findById(applicant._id)
            .exec();
          if (
            pendingApplicant &&
            pendingApplicant.status === ApplicantStatus.PENDING
          ) {
            await this.applicantModel.deleteOne({ _id: applicant._id }).exec();
            console.log(
              `Deleted unconfirmed applicant with ID: ${applicant._id}`,
            );
          }
        },
        1000 * 60 * 60,
      );

      return applicant;
    } catch (err) {
      console.error('Error creating applicant or sending email:', err);
      throw new ConflictException('Failed to create applicant');
    }
  }

  async confirmApplication(token?: string): Promise<void> {
    try {
      if (!token) {
        throw new NotFoundException('Confirmation token is required.');
      }

      console.log('Token received for confirmation:', token);

      const applicant = await this.applicantModel.findOne({
        confirmationToken: token,
      });

      if (!applicant) {
        console.error('No applicant found with this token');
        throw new NotFoundException('Invalid or expired confirmation token.');
      }

      applicant.status = ApplicantStatus.ACTIVE;
      applicant.confirmationToken = null;
      await this.notificationService.createNotification(
        'New Application',
        `${applicant.firstName} ${applicant.lastName} has submitted a new application for the position of ${applicant.positionApplied}`,
        NotificationType.APPLICANT,
        new Date(),
        applicant._id as Types.ObjectId,
      );
      await applicant.save();
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException(err);
    }
  }

  async updateApplicant(
    id: string,
    updateApplicantDto: UpdateApplicantDto,
  ): Promise<ApplicantDocument> {
    try {
      const applicant = await this.findOne(id);

      if (!applicant) {
        throw new NotFoundException(`Applicant with id ${id} not found`);
      }

      const currentDateTime = DateTime.now();

      if (updateApplicantDto.firstInterviewDate) {
        const firstInterviewDate = DateTime.fromISO(
          updateApplicantDto.firstInterviewDate.toString(),
        );

        if (firstInterviewDate <= currentDateTime) {
          throw new ConflictException(
            'First interview date and time must be in the future',
          );
        }
        const conflict = await this.checkInterviewConflict(
          firstInterviewDate,
          id,
        );
        if (conflict) {
          throw new ConflictException(
            'The selected first interview date and time is already booked.',
          );
        }

        const isReschedule = !!applicant.firstInterviewDate;
        applicant.firstInterviewDate = firstInterviewDate.toJSDate();
        applicant.currentPhase = ApplicantPhase.FIRST_INTERVIEW;
        if (
          updateApplicantDto.customSubject &&
          updateApplicantDto.customMessage
        ) {
          await this.sendEmail(
            applicant,
            EmailType.CUSTOM,
            updateApplicantDto.customSubject,
            updateApplicantDto.customMessage,
          );
        } else {
          await this.sendEmail(
            applicant,
            EmailType.FIRST_INTERVIEW,
            updateApplicantDto.customSubject,
            updateApplicantDto.customMessage,
            isReschedule,
          );
        }
      }

      if (updateApplicantDto.secondInterviewDate) {
        const secondInterviewDate = DateTime.fromISO(
          updateApplicantDto.secondInterviewDate.toString(),
        );

        if (secondInterviewDate <= currentDateTime) {
          throw new ConflictException(
            'Second interview date and time must be in the future',
          );
        }

        if (
          applicant.firstInterviewDate &&
          secondInterviewDate <=
            DateTime.fromJSDate(applicant.firstInterviewDate)
        ) {
          throw new ConflictException(
            'Second interview date must be later than the first interview date',
          );
        }
        const conflict = await this.checkInterviewConflict(
          secondInterviewDate,
          id,
        );
        if (conflict) {
          throw new ConflictException(
            'The selected second interview date and time is already booked.',
          );
        }

        const isReschedule = !!applicant.secondInterviewDate;
        applicant.secondInterviewDate = secondInterviewDate.toJSDate();
        applicant.currentPhase = ApplicantPhase.SECOND_INTERVIEW;
        if (
          updateApplicantDto.customSubject &&
          updateApplicantDto.customMessage
        ) {
          await this.sendEmail(
            applicant,
            EmailType.CUSTOM,
            updateApplicantDto.customSubject,
            updateApplicantDto.customMessage,
          );
        } else {
          await this.sendEmail(
            applicant,
            EmailType.SECOND_INTERVIEW,
            updateApplicantDto.customSubject,
            updateApplicantDto.customMessage,
            isReschedule,
          );
        }
      }

      if (updateApplicantDto.notes) {
        applicant.notes = updateApplicantDto.notes;
      }

      if (updateApplicantDto.status) {
        applicant.status = updateApplicantDto.status;

        if (updateApplicantDto.status === ApplicantStatus.REJECTED) {
          await this.sendEmail(applicant, EmailType.REJECTED_APPLICATION);
        }

        if (updateApplicantDto.status === ApplicantStatus.EMPLOYED) {
          const createUserDto: CreateUserDto = {
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            email: applicant.email,
            phone: applicant.phoneNumber,
          };

          await this.authService.signUp(createUserDto);
        }
      }

      return await applicant.save();
    } catch (err) {
      console.error('Error updating applicant:', err);
      throw new ConflictException('Failed to update applicant');
    }
  }

  private async sendEmail(
    applicant: ApplicantDocument,
    emailType: EmailType,
    customSubject?: string,
    customMessage?: string,
    isReschedule: boolean = false,
  ): Promise<void> {
    let subject: string;
    let template: string;
    const context: any = {
      name: `${applicant.firstName} ${applicant.lastName}`,
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      positionApplied: applicant.positionApplied,
    };

    switch (emailType) {
      case EmailType.FIRST_INTERVIEW:
        subject = isReschedule
          ? 'Interview Rescheduled - First Phase'
          : 'Interview Scheduled - First Phase';
        template = isReschedule
          ? 'interview-rescheduled'
          : 'interview-scheduled';
        context.interviewDate = applicant.firstInterviewDate.toLocaleString(
          'sq',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        );
        context.phase = 'first';
        break;

      case EmailType.SECOND_INTERVIEW:
        subject = isReschedule
          ? 'Interview Rescheduled - Second Phase'
          : 'Interview Scheduled - Second Phase';
        template = isReschedule
          ? 'interview-rescheduled'
          : 'interview-scheduled';
        context.interviewDate = applicant.secondInterviewDate.toLocaleString(
          'sq',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        );
        context.phase = 'second';
        break;

      case EmailType.SUCCESSFUL_APPLICATION:
        subject = 'Application Received Successfully';
        template = 'successfulApplication';
        break;

      case EmailType.REJECTED_APPLICATION:
        subject = 'Application Status - Rejected';
        template = 'application-rejected';
        break;

      case EmailType.CUSTOM:
        if (!customSubject || !customMessage) {
          throw new ConflictException(
            'Custom subject and message are required for a custom email.',
          );
        }
        subject = customSubject;
        template = 'custom-email';
        context.customMessage = customMessage;
        break;

      default:
        throw new ConflictException('Invalid email type');
    }

    context.subject = subject;

    await this.mailService.sendMail({
      to: applicant.email,
      subject: subject,
      template: template,
      context: context,
    });
  }

  private async checkInterviewConflict(
    date: DateTime,
    applicantId: string,
  ): Promise<boolean> {
    const conflict = await this.applicantModel.findOne({
      _id: { $ne: applicantId },
      $or: [
        { firstInterviewDate: date.toJSDate() },
        { secondInterviewDate: date.toJSDate() },
      ],
    });

    return !!conflict;
  }
}
