import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PatientsService } from './patients.service'
import { CreatePatientDto } from './dto/create-patient.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /** 建档：挂号模块已去掉，患者通过本接口直接建档（EMPI 入口） */
  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto)
  }

  @Get('search')
  search(@Query('keyword') keyword = '') {
    return this.patientsService.search(keyword)
  }

  /** 分页列表（患者一览翻页用，仅当前医生的患者） */
  @Get('page')
  page(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @CurrentUser() user: JwtUserPayload
  ) {
    return this.patientsService.pagedList(Number(page), Number(pageSize), user.userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findByIdOrEmpi(id)
  }
}
