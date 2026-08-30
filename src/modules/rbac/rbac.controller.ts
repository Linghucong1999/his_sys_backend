import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RbacService } from './rbac.service'

@ApiTags('rbac')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.rbacService.info()
  }
}
