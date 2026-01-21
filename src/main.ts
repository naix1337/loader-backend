import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('KeyAuth Integration API')
        .setDescription('Production-ready authentication and licensing system with KeyAuth.cc integration')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentication endpoints')
        .addTag('loader', 'C++ Loader API endpoints')
        .addTag('licensing', 'License management')
        .addTag('admin', 'Admin panel endpoints')
        .addTag('forum', 'Forum system')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`
🚀 KeyAuth Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Application running on: http://localhost:${port}
✓ API Documentation: http://localhost:${port}/api/docs
✓ Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

bootstrap();
