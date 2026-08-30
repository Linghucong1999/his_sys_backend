import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { EmrService } from './emr.service'

@ApiTags('emr')
@ApiBearerAuth()
@Controller('emr')
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.emrService.info()
  }
}
