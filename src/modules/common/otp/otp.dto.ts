import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class GenerateOtpDto {
  @IsEmail()
  @ApiProperty({
    example: 'john@gmail.com',
  })
  email: string;
}

export class ValidateOtpDto {
  @IsEmail()
  @ApiProperty({
    example: 'john@gmail.com',
  })
  email: string;

  @IsString()
  @ApiProperty({
    example: '123456',
  })
  otp: string;
}
