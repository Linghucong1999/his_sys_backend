import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { DictionariesService } from './dictionaries.service'

@ApiTags('dictionaries')
@ApiBearerAuth()
@Controller('dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get(':category')
  list(@Param('category') category: string, @Query('keyword') keyword?: string) {
    return this.dictionariesService.listByCategory(category, keyword)
  }
}
