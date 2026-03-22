import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins (configure for production)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          SMM Panel Licensing Server                       ║
║          Running on http://localhost:${port}                 ║
║                                                           ║
║  Endpoints:                                              ║
║  - POST /api/licenses/validate  Validate license         ║
║  - GET  /api/licenses           List all licenses        ║
║  - POST /api/licenses           Create new license       ║
║  - PUT  /api/licenses           Update license           ║
║  - DELETE /api/licenses/:id    Delete license           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
