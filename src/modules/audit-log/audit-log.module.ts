import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { AuditLogController } from './audit-log.controller'
import { AuditLogService } from './audit-log.service'
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema'
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor'

@Module({
  imports: [MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }])],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    // 全局注册审计拦截器：所有请求自动留痕
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor }
  ],
  exports: [AuditLogService]
})
export class AuditLogModule {}
