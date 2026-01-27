import { ApiProperty } from '@nestjs/swagger';
import { APP_ROLES } from '../../config/enum';
import { UserRole } from '_prisma/enums';

export class IUser {
  @ApiProperty({ example: 'ckx123abc' })
  id: string;

  @ApiProperty({ example: 'MBENZE' })
  lastName: string;

  @ApiProperty({ example: 'Victory' })
  firstName: string;

  @ApiProperty({ example: 'victory@gmail.com' })
  email: string;

  @ApiProperty({ example: '+21612345678' })
  phoneNumber: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

export class CreateSimpleUserDto {
  @ApiProperty({
    example: 'MBENZE',
    description: 'Last name of the user',
  })
  lastName: string;

  @ApiProperty({
    example: 'Victory',
    description: 'First name of the user',
  })
  firstName: string;

  @ApiProperty({
    enum: APP_ROLES,
    example: APP_ROLES.ADMIN,
    description: 'Role assigned to the user',
  })
  role: APP_ROLES;

  @ApiProperty({
    example: 'victory@gmail.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: '+21612345678',
    description: 'Phone number of the user',
  })
  phone: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'User password',
  })
  password: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Indicates if two-factor authentication is enabled',
  })
  enabled2FA?: boolean;

  @ApiProperty({
    example: 'https://cdn.app.com/avatar.png',
    description: 'Avatar image URL',
  })
  avatar: string;
}

class SalonDto {
  @ApiProperty({ example: 'NANA Beauty Salon' })
  name: string;

  @ApiProperty({ example: '123 Avenue Habib Bourguiba' })
  address: string;

  @ApiProperty({ example: 'Professional hair salon for women' })
  description: string;

  @ApiProperty({ example: 'Tunis' })
  city: string;

  @ApiProperty({ example: '+21698765432' })
  salonPhone: string;

  @ApiProperty({
    example: 'https://cdn.app.com/salon-cover.jpg',
    description: 'Cover image of the salon',
  })
  salonCoverImage: string;

  @ApiProperty({
    example: 5,
    description: 'Years of experience',
  })
  experience: number;
}

export class OnboardingSalonOwnerDto extends CreateSimpleUserDto {
  @ApiProperty({
    example: 'A812uidbcxllf',
    description: "L'identifiant du pack",
  })
  packId: string;
}
