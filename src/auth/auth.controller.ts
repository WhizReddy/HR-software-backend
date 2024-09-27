import {
  Body,
  Controller,
  Post,
  Request,
  Param,
  Put,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/common/schema/user.schema';
import { SignInUserDto } from './dto/signin-user.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { UpdatePasswordDto } from './dto/updatePasswordDto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/signup')
  async signUp(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.authService.signUp(createUserDto);
  }

  @Public()
  @Post('/signin')
  async signIn(
    @Body() signInUserDto: SignInUserDto,
  ): Promise<{ message: string; data: { access_token: string; user: any } }> {
    return await this.authService.signIn(signInUserDto);
  }

  @Get('getuser')
  async getProfile(@Request() req) {
    return await this.authService.getUser(req.user.email);
  }

  @Post('updatepassword')
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Request() req,
  ) {
    console.log('Decoded User Email:', req.user.email);
    return await this.authService.updatePassword(
      updatePasswordDto,
      req.user.email,
    );
  }

  @Public()
  @Post('/forgot-password')
  async forgotPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto,
  ): Promise<string> {
    return await this.authService.forgotPassword(requestResetPasswordDto.email);
  }

  @Public()
  @Post('/reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<string> {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Put('delete-user/:email')
  async deleteUser(@Param('email') email: string): Promise<string> {
    return await this.authService.removeUser(email);
  }
}
