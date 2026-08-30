import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CaService } from './ca.service'

@ApiTags('ca')
@ApiBearerAuth()
@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.caService.info()
  }
}
