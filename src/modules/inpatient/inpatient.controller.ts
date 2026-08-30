import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { InpatientService } from './inpatient.service'

@ApiTags('inpatient')
@ApiBearerAuth()
@Controller('inpatient')
export class InpatientController {
  constructor(private readonly inpatientService: InpatientService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.inpatientService.info()
  }
}
