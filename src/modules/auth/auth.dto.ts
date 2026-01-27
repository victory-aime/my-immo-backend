import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'victory@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refresh_token: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({
    example: 'ckx123abc',
  })
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
  })
  @IsString()
  password: string;
}
