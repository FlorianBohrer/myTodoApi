// Serverless-Einstieg für Vercel: baut die NestJS-App einmal pro warmer
// Instanz auf (Cache) und reicht danach jeden Request an Express durch.
// Nutzt den fertig kompilierten Code aus dist/ (Build-Command: nest build).
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('../dist/src/app.module');

let cachedServer = null;

async function getServer() {
  if (cachedServer) return cachedServer;

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Muss zur Konfiguration in src/main.ts passen.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/, 'https://my-todo.app'],
  });

  await app.init();
  cachedServer = expressApp;
  return cachedServer;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
