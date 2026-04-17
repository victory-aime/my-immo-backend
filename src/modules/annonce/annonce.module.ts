import { Module } from '@nestjs/common';
import { AnnonceService } from './annonce.service';
import { AnnonceController } from './annonce.controller';
import { DatabaseModule } from '_root/database/database.module'; //  On utilise le même que l'agence
import { CloudinaryModule } from '_root/modules/cloudinary/cloudinary.module'; // Pour l'upload d'images

@Module({
  imports: [
    DatabaseModule, //  C'est ici que se trouve la connexion Prisma
    CloudinaryModule, //  C'est ici que se trouve l'UploadsService
  ],
  controllers: [AnnonceController],
  providers: [AnnonceService],
})
export class AnnonceModule {}
