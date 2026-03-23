import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';
import { Salary } from '../common/schema/salary.schema';
import { User } from '../common/schema/user.schema';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Cron } from '@nestjs/schedule';
import { paginate } from 'src/common/util/pagination';

@Injectable()
export class SalaryService {
  constructor(
    @InjectModel(Salary.name) private salaryModel: Model<Salary>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private hasNumber(value?: number): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private normalizePage(page?: number) {
    if (!this.hasNumber(page)) {
      return undefined;
    }

    return Math.max(0, Math.floor(page));
  }

  private normalizeLimit(limit?: number) {
    if (!this.hasNumber(limit) || limit <= 0) {
      return undefined;
    }

    return Math.floor(limit);
  }

  private buildUserNameFilter(search: string) {
    const terms = search
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return {
      $and: terms.map((term) => ({
        $or: [
          { firstName: { $regex: term, $options: 'i' } },
          { lastName: { $regex: term, $options: 'i' } },
        ],
      })),
    };
  }

  async create(createSalaryDto: CreateSalaryDto): Promise<Salary> {
    try {
      await this.checkUserId(createSalaryDto.userId);
      // getMonth() is 0-based (Jan=0, Dec=11) — no subtraction needed
      const month = new Date().getMonth();
      const year = new Date().getFullYear();
      createSalaryDto.userId = new Types.ObjectId(createSalaryDto.userId);

      if (
        await this.salaryModel.findOne({
          userId: createSalaryDto.userId,
          month: month,
          year: year,
        })
      ) {
        throw new ConflictException('Salary already exists for this month');
      } else {
        const newSalary = new this.salaryModel(
          await this.calculateNetSalary(createSalaryDto),
        );
        return newSalary.save();
      }
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new ConflictException(error);
    }
  }

  async findAll(
    page: number,
    limit: number,
    month?: number,
    year?: number,
    maxnetSalary?: number,
    minnetSalary?: number,
    workingDays?: number,
    bonus?: number,
    fullName?: string,
  ): Promise<any> {
    try {
      const normalizedPage = this.normalizePage(page);
      const normalizedLimit = this.normalizeLimit(limit);
      const trimmedFullName = fullName?.trim();
      const filter: any = {};
      if (this.hasNumber(month)) filter.month = month;
      if (this.hasNumber(year)) filter.year = year;
      if (this.hasNumber(workingDays)) filter.workingDays = workingDays;
      if (this.hasNumber(bonus)) filter.bonus = bonus;

      const hasMinNetSalary = this.hasNumber(minnetSalary);
      const hasMaxNetSalary = this.hasNumber(maxnetSalary);
      const salaryFloor =
        hasMinNetSalary && hasMaxNetSalary
          ? Math.min(minnetSalary, maxnetSalary)
          : minnetSalary;
      const salaryCeiling =
        hasMinNetSalary && hasMaxNetSalary
          ? Math.max(minnetSalary, maxnetSalary)
          : maxnetSalary;

      if (hasMinNetSalary || hasMaxNetSalary) {
        filter.netSalary = {};

        if (this.hasNumber(salaryFloor)) {
          filter.netSalary.$gte = salaryFloor;
        }

        if (this.hasNumber(salaryCeiling)) {
          filter.netSalary.$lte = salaryCeiling;
        }
      }

      if (trimmedFullName) {
        const users = await this.userModel.find(
          this.buildUserNameFilter(trimmedFullName),
        );
        filter.userId = { $in: users.map((user) => user._id) };
      }
      const populate: PopulateOptions = {
        path: 'userId',
        select: 'firstName lastName phone position createdAt',
      };
      const sort = { year: -1 as const, month: -1 as const };

      if (normalizedPage === undefined || normalizedLimit === undefined) {
        return await this.salaryModel
          .find(filter)
          .sort(sort)
          .populate(populate);
      }

      const paginatedSalary = paginate(
        normalizedPage,
        normalizedLimit,
        this.salaryModel,
        filter,
        sort,
        populate,
      );
      return paginatedSalary;
    } catch (error) {
      console.error('Error in findAll method:', error);
      throw new ConflictException(
        'An error occurred while fetching salary data',
      );
    }
  }

  async findByUserId(
    page: number,
    limit: number,
    userId: string,
    month?: number,
    year?: number,
    graf?: boolean,
  ): Promise<Salary[]> {
    try {
      const normalizedPage = this.normalizePage(page);
      const normalizedLimit = this.normalizeLimit(limit);
      const filter: any = {};
      if (userId) {
        filter.userId = new Types.ObjectId(userId);
      }
      if (this.hasNumber(month)) {
        filter.month = month;
      }
      if (this.hasNumber(year)) {
        filter.year = year;
      }

      if (graf) {
        const query = this.salaryModel
          .find(filter)
          .sort({ year: -1 as const, month: -1 as const })
          .limit(12);
        return query;
      }
      const sort = { year: -1 as const, month: -1 as const };
      const populate: PopulateOptions = {
        path: 'userId',
        select: 'firstName lastName phone position createdAt',
      };

      if (normalizedPage === undefined || normalizedLimit === undefined) {
        return await this.salaryModel
          .find(filter)
          .sort({ year: -1 as const, month: -1 as const })
          .populate(populate);
      }

      const paginatedSalary = await paginate(
        normalizedPage,
        normalizedLimit,
        this.salaryModel,
        filter,
        sort,
        populate,
      );
      return paginatedSalary;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      )
        throw error;
      throw new ConflictException(error);
    }
  }

  async findOne(id: string): Promise<Salary> {
    try {
      const salary = await this.salaryModel
        .findById(id)
        .populate('userId', 'firstName lastName phone position createdAt');
      if (!salary) {
        throw new NotFoundException(`Salary with id ${id} not found`);
      }
      return salary;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ConflictException(error);
    }
  }

  async update(id: string, updateSalaryDto: UpdateSalaryDto): Promise<Salary> {
    try {
      const existingSalary = await this.salaryModel.findById(id);
      if (!existingSalary) {
        throw new NotFoundException(`Salary with id ${id} not found`);
      }

      // Merge existing data with updates to allow partial updates without resetting fields
      const mergedData = {
        ...existingSalary.toObject(),
        ...updateSalaryDto,
      };

      const calculated = await this.calculateNetSalary(mergedData);
      const updatedSalary = await this.salaryModel.findByIdAndUpdate(
        id,
        {
          ...updateSalaryDto,
          netSalary: calculated.netSalary,
          tax: calculated.tax,
          healthInsurance: calculated.healthInsurance,
          socialSecurity: calculated.socialSecurity,
        },
        { new: true },
      );
      return updatedSalary;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ConflictException(error);
    }
  }

  private async checkUserId(userId: Types.ObjectId) {
    const userExists = await this.userModel.findById(userId);
    if (!userExists) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }

  private async calculateNetSalary(
    salaryData: CreateSalaryDto | UpdateSalaryDto,
  ): Promise<Salary> {
    // 1. Pro-rate the gross salary based on working days (standard 22-day month)
    const baseMonthlyGross = salaryData.grossSalary || 0;
    const workingDays = salaryData.workingDays || 22;
    const proRatedGross = (baseMonthlyGross / 22) * workingDays;

    // 2. Calculate Extra Hours pay (assuming 8h day, 22 days = 176h/month)
    const extraHoursPay =
      (baseMonthlyGross / (22 * 8)) * (salaryData.extraHours || 0);

    // 3. Gross for tax purposes (pro-rated base + extra hours)
    const totalGross = proRatedGross + extraHoursPay;

    // 4. Social & Health Insurance (standard employee rates)
    // Social Security: 0.095 (9.5%), Health Insurance: 0.017 (1.7%)
    const socialSecurityEmp = 0.095 * totalGross;
    const healthInsuranceEmp = 0.017 * totalGross;

    // 5. Taxable Income (Total Gross - Social Security)
    // Note: Health insurance is typically not deductible for tax purposes in many regions
    const taxableIncome = totalGross - socialSecurityEmp;

    // 6. Progressive Tax Calculation (Example Progressive logic)
    let tax = 0;
    if (taxableIncome > 200000) {
      tax = (taxableIncome - 200000) * 0.23 + 170000 * 0.13; // 23% for amount > 200k, plus middle bracket
    } else if (taxableIncome > 30000) {
      tax = (taxableIncome - 30000) * 0.13; // 13% for amount > 30k
    }

    // 7. Net Salary calculation (Gross - Taxes - Insurances + Bonus)
    let netSalary = totalGross - tax - healthInsuranceEmp - socialSecurityEmp;
    if (salaryData.bonus) {
      netSalary += salaryData.bonus;
    }

    // Save calculated values to DTO/Object for storage
    salaryData.socialSecurity = Math.round(socialSecurityEmp);
    salaryData.healthInsurance = Math.round(healthInsuranceEmp);
    salaryData.tax = Math.round(tax);
    salaryData.grossSalary = baseMonthlyGross; // Keep the original base gross
    salaryData.bonus = salaryData.bonus || 0;

    const salary = new this.salaryModel({
      ...salaryData,
      netSalary: Math.round(netSalary),
      grossSalary: Math.round(totalGross), // Store the pro-rated total gross as the actual month's gross
      month: salaryData['month'] ?? new Date().getMonth(),
      year: salaryData['year'] ?? new Date().getFullYear(),
    });

    return salary;
  }

  @Cron('0 0 28 * *')
  async handleCron() {
    try {
      // findAll signature: (page, limit, month?, year?, ...)
      // Pass null page/limit to get all, then specify month & year filters
      const currentMonth = new Date().getMonth(); // 0-based
      const currentYear = new Date().getFullYear();
      const result = await this.findAll(
        undefined,
        undefined,
        currentMonth,
        currentYear,
      );
      const currentSalaries = Array.isArray(result) ? result : result.data;

      for (const currentSalary of currentSalaries) {
        // Correct month rollover: % 12 (0-based, Jan=0 … Dec=11)
        const nextMonth = (currentSalary.month + 1) % 12;
        const nextYear =
          currentSalary.month === 11
            ? currentSalary.year + 1
            : currentSalary.year;

        const user = await this.userModel.findOne({
          _id: currentSalary.userId,
          isDeleted: false,
        });
        if (!user) continue;

        // Check if salary already exists for next month before creating
        const exists = await this.salaryModel.findOne({
          userId: currentSalary.userId,
          month: nextMonth,
          year: nextYear,
        });
        if (exists) continue;

        const newSalaryDto = {
          workingDays: currentSalary.workingDays,
          currency: currentSalary.currency,
          bonus: 0, // reset bonus each month
          bonusDescription: '',
          grossSalary: currentSalary.grossSalary,
          userId: currentSalary.userId,
          extraHours: 0, // reset extra hours each month
        } as CreateSalaryDto;

        const calculated = await this.calculateNetSalary(newSalaryDto);
        // Build the new salary record with the correct next-period month/year
        const newSalary = new this.salaryModel({
          ...newSalaryDto,
          netSalary: calculated.netSalary,
          tax: calculated.tax,
          healthInsurance: calculated.healthInsurance,
          socialSecurity: calculated.socialSecurity,
          month: nextMonth,
          year: nextYear,
        });
        await newSalary.save();
      }
    } catch (error) {
      console.error('Salary cron job failed:', error);
    }
  }
}
