import { config } from 'dotenv';
import { join } from 'path';

export const LoadEnvironmentVariables = () => {
  const env = process.env.NODE_ENV;
  const envFilePath = join(__dirname, `../../.env.${env}`);

  config({ path: envFilePath });
  console.log(`Environment loaded: ${process.env.DATABASE_URL}`);

  console.log(`Environment loaded port: ${process.env.PORT}`);
};
