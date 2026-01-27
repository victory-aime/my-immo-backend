import { UnauthorizedException } from '@nestjs/common';

export class AppUnauthorizedExceptionService extends UnauthorizedException {
  constructor(message: string, extraData?: Record<string, any>) {
    super({
      statusCode: 401,
      error: 'Unauthorized',
      message,
      ...extraData,
      timestamp: new Date().toISOString(),
    });
  }
}
