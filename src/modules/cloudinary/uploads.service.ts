import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDER_NAME } from '../../config/enum';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /**
   * Génère un nom unique basé sur :
   * nom original nettoyé
   * timestamp
   * petit suffixe aléatoire
   */
  private generateUniqueFilename(originalName: string): string {
    const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
    const sanitized = nameWithoutExt
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

    return `${sanitized}-${randomUUID()}`;
  }

  async uploadAgencyImage(
    file: Express.Multer.File,
    agencyName: string,
    folderName: string,
  ) {
    if (!file?.originalname) {
      throw new BadRequestException('Fichier invalide');
    }

    const agence = agencyName.replace(/\s+/g, '-').toLowerCase();
    const folderPath = `${CLOUDINARY_FOLDER_NAME.AGENCY}/${agence}/${folderName}`;
    const filename = this.generateUniqueFilename(file.originalname);

    return this.cloudinary.uploadImage(file.buffer, filename, folderPath);
  }

  async uploadUserImage(file: Express.Multer.File, userId: string) {
    if (!file?.originalname) {
      throw new BadRequestException('Aucun fichier reçu ou fichier invalide');
    }

    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    const filename = this.generateUniqueFilename(file.originalname);

    return this.cloudinary.uploadImage(file.buffer, filename, folderPath);
  }

  async deleteUserImage(userId: string): Promise<void> {
    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    await this.cloudinary.deleteFolder(folderPath);
  }
}
