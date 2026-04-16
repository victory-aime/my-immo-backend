import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import {
  AnnonceService,
  CreateAnnonceDto,
  UpdateAnnonceDto,
} from './annonce.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('annonces')
export class AnnonceController {
  constructor(private readonly annonceService: AnnonceService) {}

  @AllowAnonymous() // 🔥 Indispensable pour autoriser Postman sans login
  @Post()
  create(@Body() dto: CreateAnnonceDto) {
    return this.annonceService.createAnnonce(dto);
  }

  @AllowAnonymous() // 🔥 Indispensable pour voir la liste dans le navigateur
  @Get()
  findAll() {
    return this.annonceService.findAllAnnonces();
  }

  @AllowAnonymous()
  @Get('agency/:agencyId')
  findByAgency(@Param('agencyId') agencyId: string) {
    return this.annonceService.findAnnoncesByAgency(agencyId);
  }

  @AllowAnonymous() // Ajoute cette ligne temporairement
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnonceDto) {
    return this.annonceService.updateAnnonce(id, dto);
  }
  @AllowAnonymous() // Ajoute cette ligne temporairement
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.annonceService.deleteAnnonce(id);
  }
}
