import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  // 全局路由前缀：所有接口为 /api/xxx
  app.setGlobalPrefix('api')

  // 全局 DTO 校验：剥离未声明字段 + 自动类型转换
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  )

  // 统一响应结构 { code, data, message } 与统一异常结构
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  // 桌面端渲染进程跨域（开发模式下 dev server 端口不同）
  app.enableCors({ origin: true, credentials: true })

  // Swagger 接口文档：http://127.0.0.1:3000/api/docs
  const config = new DocumentBuilder()
    .setTitle('HIS 医生工作站 API')
    .setDescription('HIS 系统后端接口文档（NestJS + Mongoose + MongoDB rs0）')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(process.env.PORT ?? 3000)
  console.log(`HIS backend running at http://127.0.0.1:${process.env.PORT ?? 3000}/api`)
}

void bootstrap()
