import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

/**
 * Service utilitaire pour compiler soit :
 * - un template Handlebars (.hbs) → HTML rendu
 * - un template PDF (.pdf) → Buffer de PDF rempli
 */
@Injectable()
export class CompileTemplateService {
  private readonly basePath = path.resolve('./src/modules/mail/templates/');

  /**
   * Compile un template selon son type
   * @param type - "hbs" ou "pdf"
   * @param templateName - nom du fichier sans extension
   * @param context - données à injecter
   */
  async compileTemplate<T extends Record<string, any>>(
    type: 'pdf' | 'hbs',
    templateName: string,
    context?: T,
  ): Promise<string | Buffer> {
    if (type === 'hbs') {
      return this.compileHbs(templateName, context);
    } else if (type === 'pdf') {
      //return this.compilePdf(templateName, context);
      return 'pdf';
    } else {
      throw new BadRequestException('Invalid template type');
    }
  }

  /**
   * Compile un fichier Handlebars (.hbs)
   */
  private compileHbs<T extends Record<string, any>>(
    templateName: string,
    context?: T,
  ): string {
    const fullPath = path.join(this.basePath, `${templateName}.hbs`);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`Template file not found: ${fullPath}`);
    }

    const templateSource = fs.readFileSync(fullPath, 'utf8');
    const template = Handlebars.compile(templateSource);

    return template(context || {});
  }

  /**
   * Remplit dynamiquement un PDF template avec pdf-lib
   */
  // private async compilePdf<T extends Record<string, any>>(
  //   templateName: string,
  //   context?: T,
  // ): Promise<Buffer> {
  //   const fullPath = path.join(this.basePath, `${templateName}.pdf`);
  //
  //   if (!fs.existsSync(fullPath)) {
  //     throw new NotFoundException(`Template file not found: ${fullPath}`);
  //   }
  //
  //   const pdfBytes = fs.readFileSync(fullPath);
  //   const pdfDoc = await PDFDocument.load(pdfBytes);
  //   const form = pdfDoc.getForm();
  //
  //   // 🪄 Remplir dynamiquement les champs selon les clés du context
  //   if (context) {
  //     for (const [key, value] of Object.entries(context)) {
  //       const field = form.getTextField(key);
  //       if (field) {
  //         field.setText(String(value));
  //       }
  //     }
  //   }
  //
  //   form.flatten(); // Rendre les champs non modifiables
  //   const filledPdfBytes = await pdfDoc.save();
  //   return Buffer.from(filledPdfBytes);
  // }
}
