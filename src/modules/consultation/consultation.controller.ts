import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ConsultationService } from './consultation.service'

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.consultationService.info()
  }
}
