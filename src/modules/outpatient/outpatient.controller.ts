import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { OutpatientService } from './outpatient.service'

@ApiTags('outpatient')
@ApiBearerAuth()
@Controller('outpatient')
export class OutpatientController {
  constructor(private readonly outpatientService: OutpatientService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.outpatientService.info()
  }
}
