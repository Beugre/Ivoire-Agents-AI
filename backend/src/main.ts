import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Sécurité HTTP headers
  app.use((helmet as any).default ? (helmet as any).default() : (helmet as any)());

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3001',
      'https://ivoire-agents-frontend.vercel.app',
      'https://ivoire-agents-ai.vercel.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Ivoire Agents AI backend démarré sur le port ${port}`);
}
bootstrap();
