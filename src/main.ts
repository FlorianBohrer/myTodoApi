import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // whitelist: unbekannte Felder aus Requests entfernen (Schutz, weil DTOs
  // direkt in DB-Updates fließen).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Lokale Entwicklung (alle localhost-Ports) + die Live-Domain.
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, 'https://my-todo.app'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
