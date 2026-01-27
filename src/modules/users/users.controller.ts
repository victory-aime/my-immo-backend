import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { API_URL } from '_root/config/api';
import { MiddlewareGuard } from '_root/guard/middleware.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_TAGS } from '_root/config/enum';

@ApiTags(SWAGGER_TAGS.USER_MANAGEMENT)
@Controller()
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(MiddlewareGuard)
  @ApiBearerAuth()
  @Get(API_URL.USER.INFO)
  @ApiOperation({ summary: 'Récupérer les informations d’un utilisateur' })
  @ApiQuery({
    name: 'userId',
    required: true,
    example: 'ckx123abc',
    description: 'Identifiant unique de l’utilisateur',
  })
  @ApiOkResponse({ description: 'Informations utilisateur récupérées.' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable.' })
  async getUserInfo(@Query('userId') userId: string) {
    return this.userService.userInfo(userId);
  }

  @UseGuards(MiddlewareGuard)
  @ApiBearerAuth()
  @Post(API_URL.USER.REGENERATE_PASSWORD)
  @ApiOperation({ summary: 'Régénérer le mot de passe utilisateur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'victory@gmail.com',
        },
        password: {
          type: 'string',
          example: 'P@ssw0rd!',
        },
      },
      required: ['email', 'password'],
    },
  })
  @ApiOkResponse({ description: 'Mot de passe mis à jour avec succès.' })
  @ApiBadRequestResponse({ description: 'Email ou mot de passe invalide.' })
  async regeneratePassword(@Body() data: { email: string; password: string }) {
    return this.userService.regeneratePassword(data.email, data.password);
  }
}
