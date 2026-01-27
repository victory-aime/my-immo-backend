import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BASE_APIS_URL } from './enum';

export function setupSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle('NANA Platform API Documentation')
    .setDescription(
      'Here are classified all the APIs available in the backend and also how to retrieve and access this data',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  SwaggerModule.setup(BASE_APIS_URL.SWAGGER, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: "Back office API's docs",
  });
}
