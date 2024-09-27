import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';
import { User } from '../common/schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { SignInUserDto } from './dto/signin-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePasswordDto } from './dto/updatePasswordDto';
import { generateRandomPassword } from 'src/common/util/generateRandomPassword';
import { Auth } from 'src/common/schema/auth.schema';
import { MailService } from 'src/mail/mail.service';
import { randomBytes } from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: mongoose.Model<User>,
    @InjectModel(Auth.name) private authModel: mongoose.Model<Auth>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { email, ...userProperties } = createUserDto;

      const password = generateRandomPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const existingAuth = await this.authModel.findOne({ email });
      if (existingAuth) {
        throw new ConflictException('Email already exists');
      }

      const userAuth = await this.authModel.create({
        email,
        password: hashedPassword,
      });

      const user = await this.userModel.create({
        ...userProperties,
        auth: userAuth._id,
      });

      // Send welcome email
      await this.mailService.sendMail({
        to: createUserDto.email,
        subject: 'Welcome to Codevider',
        template: 'welcome',
        context: {
          name: `${createUserDto.firstName} ${createUserDto.lastName}`,
          email: createUserDto.email,
          password,
        },
      });
      return user;
    } catch (err) {
      throw new ConflictException('Error creating user');
    }
  }

  // Sign In logic
  async signIn(signInUserDto: SignInUserDto): Promise<{
    message: string;
    data: { access_token: string; user: any };
  }> {
    try {
      const userAuth = await this.authModel.findOne({
        email: signInUserDto.email,
      });
      if (!userAuth) {
        throw new NotFoundException('Email not found');
      }

      const user = await this.userModel
        .findOne({ auth: userAuth._id })
        .populate('auth');

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(
        signInUserDto.password,
        userAuth.password,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: user.id,
        email: userAuth.email,
        role: user.role,
      };

      return {
        message: 'Authenticated Successfully',
        data: {
          access_token: await this.jwtService.signAsync(payload),
          user: {
            ...user.toObject(),
            email: userAuth.email,
          },
        },
      };
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof NotFoundException
      ) {
        throw err;
      } else {
        throw new InternalServerErrorException('Server error');
      }
    }
  }

  async forgotPassword(email: string): Promise<string> {
    try {
      const userAuth = await this.authModel.findOne({ email });
      if (!userAuth) {
        throw new NotFoundException('User not found');
      }

      const resetToken = randomBytes(32).toString('hex');
      userAuth.resetPasswordToken = resetToken;
      userAuth.resetPasswordExpires = Date.now() + 3600000;
      await userAuth.save();

      const resetUrl = `${process.env.FRONT_URL}/reset-password?token=${resetToken}`;

      await this.mailService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'resetPassword',
        context: {
          name: email,
          resetUrl,
        },
      });

      return 'Password reset link has been sent to your email';
    } catch (err) {
      console.error('Error during password reset request:', err);
      throw new ConflictException('Error during password reset request');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    try {
      const { token, newPassword } = resetPasswordDto;

      const userAuth = await this.authModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!userAuth) {
        throw new NotFoundException('Invalid or expired token');
      }

      const salt = await bcrypt.genSalt(10);
      userAuth.password = await bcrypt.hash(newPassword, salt);
      userAuth.resetPasswordToken = null;
      userAuth.resetPasswordExpires = null;
      await userAuth.save();

      return 'Password reset successfully';
    } catch (err) {
      throw new ConflictException('Error resetting password');
    }
  }

  async getUser(email: string): Promise<User> {
    try {
      const userAuth = await this.authModel.findOne({ email });
      const user = await this.userModel
        .findOne({ auth: userAuth._id })
        .populate('auth');
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (err) {
      throw new ConflictException('Error retrieving user');
    }
  }

  async updatePassword(
    updatePasswordDto: UpdatePasswordDto,
    email: string,
  ): Promise<string> {
    try {
      const userAuth = await this.authModel.findOne({ email });

      if (!userAuth) {
        throw new NotFoundException('User not found');
      }

      const isMatch = await bcrypt.compare(
        updatePasswordDto.oldPassword,
        userAuth.password,
      );
      if (!isMatch) {
        throw new UnauthorizedException('Invalid old password');
      }

      const salt = await bcrypt.genSalt(10);
      userAuth.password = await bcrypt.hash(
        updatePasswordDto.newPassword,
        salt,
      );
      await userAuth.save();

      return 'Password updated successfully';
    } catch (err) {
      console.error('Error updating password:', err);
      throw new ConflictException('Error updating password');
    }
  }

  async removeUser(email: string): Promise<string> {
    try {
      await this.authModel.findOneAndUpdate(
        { email },
        { isDeleted: true },
        { new: true },
      );
      return 'User deleted successfully';
    } catch (err) {
      throw new ConflictException('Error deleting user');
    }
  }
}
