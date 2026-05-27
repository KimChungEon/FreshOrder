import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FreshOrder API')
    .setDescription('프렌차이즈 본사/직영점 발주 서비스 API')
    .setVersion('0.1.0')
    .addServer('/api')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // nginx가 /api/* 를 백엔드 / 로 strip 해 넘기므로, Nest 측은 /docs 로 둔다.
  // (브라우저에서는 http://host/api/docs 로 접근)
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

void bootstrap();
