import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { EmrService } from './emr.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

class SaveRecordDto {
  @IsString()
  @IsNotEmpty()
  patientId: string

  @IsString()
  @IsNotEmpty()
  patientName: string

  @IsIn(['outpatient', 'admission', 'prescription'])
  type: 'outpatient' | 'admission' | 'prescription'

  @IsOptional()
  @IsString()
  department?: string

  @IsOptional()
  @IsString()
  visitId?: string

  @IsOptional()
  @IsString()
  chiefComplaint?: string

  @IsOptional()
  @IsString()
  presentIllness?: string

  @IsOptional()
  @IsString()
  pastHistory?: string

  @IsOptional()
  @IsString()
  physicalExam?: string

  @IsOptional()
  @IsArray()
  diagnosis?: Array<{ code: string; name: string }>

  @IsOptional()
  @IsString()
  prescriptionSummary?: string

  @IsOptional()
  @IsString()
  examRequest?: string

  @IsOptional()
  @IsString()
  visitedAt?: string
}

@ApiTags('emr')
@ApiBearerAuth()
@Controller('emr')
export class EmrController {
  constructor(private readonly emrService: EmrService) {}

  @Get('records')
  list(
    @Query('keyword') keyword?: string,
    @Query('signed') signed?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: JwtUserPayload
  ) {
    return this.emrService.list({ keyword, signed, type }, this.scopeDoctorId(user))
  }

  /** 分页列表（EMR 左侧列表翻页用） */
  @Get('records/page')
  page(
    @Query('keyword') keyword?: string,
    @Query('signed') signed?: string,
    @Query('type') type?: string,
    @Query('recent') recent?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @CurrentUser() user?: JwtUserPayload
  ) {
    return this.emrService.pagedList(
      {
        keyword,
        signed,
        type,
        recent,
        page: Number(page),
        pageSize: Number(pageSize)
      },
      this.scopeDoctorId(user)
    )
  }

  /** 数据权限：admin 可见全部，医生仅可见自己名下病历 */
  private scopeDoctorId(user?: JwtUserPayload): string | undefined {
    if (!user) return undefined
    return user.roles.includes('admin') ? undefined : user.userId
  }

  @Get('records/:id')
  findOne(@Param('id') id: string) {
    return this.emrService.findById(id)
  }

  @Post('records')
  save(@Body() dto: SaveRecordDto, @CurrentUser() user: JwtUserPayload) {
    return this.emrService.save(dto, user.username, user.userId)
  }

  @Put('records/:id')
  update(@Param('id') id: string, @Body() dto: SaveRecordDto, @CurrentUser() user: JwtUserPayload) {
    return this.emrService.save(dto, user.username, user.userId, id)
  }

  /** CA 签名 */
  @Post('records/:id/sign')
  sign(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.emrService.sign(id, { userId: user.userId, username: user.username })
  }
}
