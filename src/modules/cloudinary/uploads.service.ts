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
    const ext = originalName.split('.').pop();

    const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
    const sanitized = nameWithoutExt
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .toLowerCase();

    return `${sanitized}-${randomUUID()}`;
  }

  private getResourceType(mimetype: string): 'image' | 'raw' {
    if (mimetype.startsWith('image/')) {
      return 'image';
    }
    return 'raw';
  }

  async uploadFiles(file: Express.Multer.File, agencyName: string, folderName: string) {
    if (!file?.originalname) {
      throw new BadRequestException('Fichier invalide');
    }

    const agence = agencyName.replace(/\s+/g, '-').toLowerCase();
    const folderPath = `${CLOUDINARY_FOLDER_NAME.AGENCY}/${agence}/${folderName}`;
    const filename = this.generateUniqueFilename(file.originalname);

    const resourceType = this.getResourceType(file.mimetype);

    return this.cloudinary.uploadFile(file.buffer, filename, folderPath, resourceType);
  }

  async uploadUserImage(file: Express.Multer.File, userId: string) {
    if (!file?.originalname) {
      throw new BadRequestException('Aucun fichier reçu ou fichier invalide');
    }

    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    const filename = this.generateUniqueFilename(file.originalname);

    return this.cloudinary.uploadFile(file.buffer, filename, folderPath, 'image');
  }

  async deleteUserImage(userId: string): Promise<void> {
    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    await this.cloudinary.deleteFolder(folderPath);
  }
}
