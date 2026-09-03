import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RegionsService } from './regions.service'

@ApiTags('regions')
@ApiBearerAuth()
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  /** 省市区三级树（建档住址级联选择用） */
  @Get()
  tree() {
    return this.regionsService.getTree()
  }
}
