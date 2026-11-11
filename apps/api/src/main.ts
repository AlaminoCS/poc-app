import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// CommonJS interop for cookie-parser under Nest's compiler
const cookieParser = require("cookie-parser");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = (
    process.env.CORS_ORIGIN ??
    "http://localhost:3000,http://127.0.0.1:3000,https://poc.alamino.dev.br,https://poc-app-drab.vercel.app"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(cookieParser());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
