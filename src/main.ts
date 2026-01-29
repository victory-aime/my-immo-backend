import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as figlet from 'figlet';
import { LoadEnvironmentVariables } from './config/env';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { setupSwagger } from './config/swagger';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { toNodeHandler } from 'better-auth/node';

async function bootstrap() {
  LoadEnvironmentVariables();
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Access Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // Access BetterAuth instance from AuthService
  const authService = app.get<AuthService>(AuthService);

  // Mount BetterAuth before body parsers
  expressApp.all(
    /^\/api\/auth\/.*/,
    toNodeHandler(authService.instance.handler),
  );

  // Re-enable Nest's JSON body parser AFTER mounting BetterAuth
  expressApp.use(require('express').json());
  app.setGlobalPrefix('api');
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  setupSwagger(app);

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
