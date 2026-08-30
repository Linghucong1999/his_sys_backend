import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { DictionariesService } from './dictionaries.service'

@ApiTags('dictionaries')
@ApiBearerAuth()
@Controller('dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  /** 模块存活探针（占位） */
  @Get('ping')
  ping() {
    return this.dictionariesService.info()
  }
}
