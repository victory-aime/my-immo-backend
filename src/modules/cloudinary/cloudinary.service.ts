import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    folderPath: string,
    resourceType: 'image' | 'raw',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // ✅ Pour les images, Cloudinary ajoute l'ext automatiquement → on la retire du public_id
      // Pour raw, il ne l'ajoute pas → on la garde
      const publicId = resourceType === 'image' ? filename.replace(/\.[^/.]+$/, '') : filename;

      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: publicId,
          folder: folderPath,
          access_mode: 'public',
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) resolve(result);
          else reject(new Error('UploadApiResponse is undefined'));
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  }

  async listFiles(folderPath: string) {
    const prefix = folderPath.replace(/\/$/, '');

    const fetchByType = (resource_type: 'image' | 'raw' | 'video') =>
      cloudinary.api
        .resources({
          type: 'upload',
          resource_type,
          prefix,
          max_results: 500,
        })
        .then((r) => r.resources || [])
        .catch(() => []);

    const [images, raws, videos] = await Promise.all([
      fetchByType('image'),
      fetchByType('raw'),
      fetchByType('video'),
    ]);

    const all = [...images, ...raws, ...videos];

    return all;
  }

  async moveFile(publicId: string, newFolder: string, resourceType: 'image' | 'raw') {
    try {
      const filename = publicId.split('/').pop();
      const newPublicId = `${newFolder}/${filename}`;

      return await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        resource_type: resourceType, // ✅ correct
      });
    } catch (err) {
      console.error('Erreur move file Cloudinary:', err);
      throw err;
    }
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      // 1. supprimer images
      await cloudinary.api
        .delete_resources_by_prefix(folderPath, {
          resource_type: 'image',
        })
        .catch(() => {});

      // 2. supprimer raw (PDF etc)
      await cloudinary.api
        .delete_resources_by_prefix(folderPath, {
          resource_type: 'raw',
        })
        .catch(() => {});

      // 3. attendre propagation Cloudinary
      await new Promise((res) => setTimeout(res, 500));

      // 4. supprimer dossier
      await cloudinary.api.delete_folder(folderPath).catch(() => {});
    } catch (err) {
      console.error('Erreur suppression Cloudinary:', err);
      // ❌ NE PAS throw → surtout pour CRON
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`Erreur suppression image Cloudinary : ${publicId}`, err);
      throw err;
    }
  }
}
