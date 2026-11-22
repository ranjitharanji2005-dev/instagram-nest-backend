import { Controller,Get, Post,Body,UseGuards,} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Req, Res  } from '@nestjs/common';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @Get('register')
    registerPage() {
      return {
        message: 'Registration API is working!',
        instruction: 'Send a POST request to register a user.'
      };
  }

  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
    }
  
  @Post('login')
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
 

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.sub);
  }

  // Step 1: Start Google login
  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  // Step 2: Receive Google's response
 @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() request: any,
    @Res() response: any,
  ) {
    const result = await this.authService.googleLogin(request.user);

    const frontendUrl = 'http://localhost:3001';

    response.redirect(
      `${frontendUrl}/auth/google/callback?challenge_id=${encodeURIComponent(result.challenge_id)}&email=${encodeURIComponent(result.email)}`,
    );
  }

  @Post('auth/google/verify-otp')
  verifyGoogleOtp(
    @Body('challenge_id') challengeId: string,
    @Body('otp') otp: string,
  ) {
    return this.authService.verifyGoogleOtp(challengeId, otp);
  }

}