import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpError extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode?: string,
  ) {
    super(
      {
        success: false,
        message,
        errorCode: errorCode ?? null,
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
