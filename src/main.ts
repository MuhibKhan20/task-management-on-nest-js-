import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

let server: any;

async function createNestServer() {
  if (!server) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    
    app.enableCors({
      origin: ['http://localhost:5173', 'https://task-manager-0d77.onrender.com', /\.vercel\.app$/, /localhost:\d+/],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });
    
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    
    await app.init();
    server = expressApp;
  }
  return server;
}

// For serverless (Vercel)
export default async function handler(req: any, res: any) {
  const app = await createNestServer();
  return app(req, res);
}

// For local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173', 'https://task-manager-0d77.onrender.com', /\.vercel\.app$/, /localhost:\d+/],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 4001;
  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
}

if (require.main === module) {
  bootstrap();
}
