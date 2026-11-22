import { Injectable, ConflictException ,UnauthorizedException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

import { JwtService } from '@nestjs/jwt';
import { EmailService } from './email.service';
import { randomInt, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    private readonly emailService: EmailService,
  ) {}

    private readonly googleOtpChallenges = new Map<
    string,
    {
      email: string;
      otp: string;
      expiresAt: number;
    }
  >();

  async register(data: RegisterDto) {
    // Step 1: Check whether the email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    // Step 2: Reject duplicate email
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Step 3: Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Step 4: Create a new user object
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
    });

    // Step 5: Save the user in MySQL
    await this.userRepository.save(user);

    // Step 6: Return a safe response
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async login(data: LoginDto) {
    // Step 1: Find the user by email
    const user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    // Step 2: Check whether the user exists
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Step 3: Compare entered password with stored hash
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.password,
    );

    // Step 4: Check whether the password is correct
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Step 5: Return login success

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });
    return {
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }


  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      user: user,
    };
  }



  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
  }) {
    // Step 1: Find user by Google ID
    let user = await this.userRepository.findOne({
      where: { google_id: googleUser.googleId },
    });

    // Step 2: If not found, check email
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email: googleUser.email },
      });
    }

    // Step 3: Create a new user if not found
    if (!user) {
      user = this.userRepository.create({
        name: googleUser.name,
        email: googleUser.email,
        google_id: googleUser.googleId,
        password: null,
      });

      await this.userRepository.save(user);
    } else if (!user.google_id) {
      // Link Google ID to an existing email account
      user.google_id = googleUser.googleId;
      await this.userRepository.save(user);
    }

    // Step 4: Generate a 6-digit OTP
    const otp = randomInt(100000, 1000000).toString();

    // Step 5: Generate a unique challenge ID
    const challengeId = randomUUID();

    // Step 6: Store OTP for 5 minutes
    this.googleOtpChallenges.set(challengeId, {
      email: user.email,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // Step 7: Send OTP to Gmail
    await this.emailService.sendOtpEmail(user.email, otp);

    // Step 8: Return challenge information
    return {
      success: true,
      email_otp_required: true,
      challenge_id: challengeId,
      email: user.email,
      message: 'OTP sent to your email',
    };
  }
   
  async verifyGoogleOtp(challengeId: string, enteredOtp: string) {
    // Step 1: Find the stored OTP challenge
    const challenge = this.googleOtpChallenges.get(challengeId);

    // Step 2: Check whether the challenge exists
    if (!challenge) {
      throw new UnauthorizedException('Invalid OTP challenge');
    }

    // Step 3: Check whether OTP has expired
    if (Date.now() > challenge.expiresAt) {
      this.googleOtpChallenges.delete(challengeId);
      throw new UnauthorizedException('OTP has expired');
    }

    // Step 4: Compare entered OTP
    if (challenge.otp !== enteredOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Step 5: Find the user
    const user = await this.userRepository.findOne({
      where: { email: challenge.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Step 6: Delete the used OTP challenge
    this.googleOtpChallenges.delete(challengeId);

    // Step 7: Generate JWT token
    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    // Step 8: Return login response
    return {
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

}