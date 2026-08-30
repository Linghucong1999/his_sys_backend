import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SearchService } from './search.service'

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Cmd+K 聚合搜索：患者/病历/药品/命令 */
  @Get()
  search(@Query('q') q = '', @Query('limit') limit = '8') {
    return this.searchService.search(q, Number(limit))
  }
}
