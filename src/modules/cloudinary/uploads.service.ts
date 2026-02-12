import { BadRequestException, Injectable } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CLOUDINARY_FOLDER_NAME } from '../../config/enum';

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async uploadAgencyImage(file: Express.Multer.File, agencyName: string) {
    const agence = agencyName.replace(/\s+/g, '-').toLowerCase();
    const folderPath = `${CLOUDINARY_FOLDER_NAME.AGENCY}/${agence}`;
    const filename = file.originalname.split('.')[0];

    return this.cloudinary.uploadImage(file.buffer, filename, folderPath);
  }

  async uploadUserImage(file: Express.Multer.File, userId: string) {
    if (!file?.originalname) {
      throw new BadRequestException('Aucun fichier reçu ou fichier invalide');
    }

    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    const filename = file.originalname.split('.')[0];

    return this.cloudinary.uploadImage(file.buffer, filename, folderPath);
  }

  async deleteUserImage(userId: string): Promise<void> {
    const folderPath = `${CLOUDINARY_FOLDER_NAME.USERS}/${userId}`;
    await this.cloudinary.deleteFolder(folderPath);
  }
}
