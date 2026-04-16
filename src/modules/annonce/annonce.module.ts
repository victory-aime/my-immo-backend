import { Module } from '@nestjs/common';
import { AnnonceService } from './annonce.service';
import { AnnonceController } from './annonce.controller';

@Module({
  providers: [AnnonceService],
  controllers: [AnnonceController],
})
export class AnnonceModule {}
