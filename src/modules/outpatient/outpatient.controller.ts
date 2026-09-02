import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { OutpatientService } from './outpatient.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

class CreateVisitDto {
  @IsString()
  @IsNotEmpty()
  patientId: string

  @IsString()
  @IsNotEmpty()
  empiId: string

  @IsString()
  @IsNotEmpty()
  patientName: string

  @IsIn(['first', 'followup'])
  type: 'first' | 'followup'

  @IsOptional()
  @IsString()
  chiefComplaint?: string
}

@ApiTags('outpatient')
@ApiBearerAuth()
@Controller('outpatient')
export class OutpatientController {
  constructor(private readonly outpatientService: OutpatientService) {}

  /** 医师接诊：创建就诊记录（无挂号流程） */
  @Post('visits')
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: JwtUserPayload) {
    return this.outpatientService.createVisit({
      ...dto,
      doctorId: user.userId,
      doctorName: user.username.startsWith('D') ? '王医生' : user.username,
      department: '呼吸内科'
    })
  }

  @Get('visits/today')
  listToday() {
    return this.outpatientService.listToday()
  }

  @Get('visits/patient/:patientId')
  listByPatient(@Param('patientId') patientId: string, @CurrentUser() user: JwtUserPayload) {
    // 医生仅可见自己的接诊记录；admin 可见全部
    const doctorId = user.roles.includes('admin') ? undefined : user.userId
    return this.outpatientService.listByPatient(patientId, doctorId)
  }
}
