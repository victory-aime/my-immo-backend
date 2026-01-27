import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as figlet from 'figlet';
import { LoadEnvironmentVariables } from './config/env';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { setupSwagger } from './config/swagger';

async function bootstrap() {
  LoadEnvironmentVariables();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device'],
    methods: '*',
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  setupSwagger(app);
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //     forbidNonWhitelisted: true,
  //   }),
  // );

  await app.listen(process.env.PORT!, async () => {
    figlet(`${new Date().getFullYear()}- MyImmo`, (_, data) => {
      console.log('\x1b[1m\x1b[32m%s\x1b[0m', data);
      figlet('Powered By VICTORY', { font: 'Small' }, (a, res) =>
        console.log('\x1b[35m%s\x1b[0m', res),
      );
    });
  });
}
bootstrap();
