import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseInterceptors,
  ParseEnumPipe,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Session } from '@thallesp/nestjs-better-auth';
import { IntegrationsService } from './services/integrations.service';
import { IntegrationProviderType } from '../../../prisma/generated/enums';
import { CLOUDINARY_FOLDER_NAME } from '_root/config/enum';

@Controller('v1/secure/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /** Route SÉCURISÉE — appelée en fetch() par le front, renvoie juste l'URL */
  @Get('/providers/connect-url')
  getConnectUrl(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Session() session: { user: { id: string } },
  ) {
    const url = this.integrationsService.getConnectUrl(session.user.id, provider);
    return { url };
  }

  /**
   * Callback OAuth — PAS de guard ici : l'utilisateur arrive depuis Google/Dropbox,
   * sans JWT applicatif. La sécurité vient du `state` signé (JWT court, 5min, anti-CSRF).
   */
  @Get('/providers/callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { frontRedirectUrl } = await this.integrationsService.handleCallback(code, state);
    return res.redirect(frontRedirectUrl);
  }

  @Get('/providers/status')
  getStatus(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.getStatus(session.user.id, provider);
  }

  @Post('/providers/disconnect')
  disconnect(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.disconnect(session.user.id, provider);
  }

  @Post('/providers/upload')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 5 }]))
  async uploadFile(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
    @Session() session: { user: { id: string } },
  ) {
    if (files?.file?.length) {
      await Promise.all(
        files.file.map((data) =>
          this.integrationsService.uploadFile(session.user.id, provider, data),
        ),
      );
    }
  }

  @Get('/providers/files')
  listFiles(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.listFiles(session.user.id, provider);
  }

  @Get('/providers/list-trashed')
  listTrashedFiles(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.listTrashedFiles(session.user.id, provider);
  }

  @Post('/providers/trashed')
  trashedFiles(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Query('fileId') fileId: string,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.trashFile(session.user.id, provider, fileId);
  }

  @Post('/providers/delete-file')
  deleteFiles(
    @Query('provider', new ParseEnumPipe(IntegrationProviderType))
    provider: IntegrationProviderType,
    @Query('fileId') fileId: string,
    @Session() session: { user: { id: string } },
  ) {
    return this.integrationsService.deleteFilePermanently(session.user.id, provider, fileId);
  }
}
