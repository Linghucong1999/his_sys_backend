import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { AuditLogService } from './audit-log.service'

@ApiTags('audit-log')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /** 查询审计日志（仅管理员） */
  @Get()
  @Roles('admin')
  findAll(@Query('skip') skip = '0', @Query('limit') limit = '50') {
    return this.auditLogService.findAll(Number(skip), Number(limit))
  }
}
