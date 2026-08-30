import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ConsultationService } from './consultation.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

class CreateConsultationDto {
  @IsString()
  @IsNotEmpty()
  patientId: string

  @IsString()
  @IsNotEmpty()
  patientName: string

  @IsOptional()
  @IsString()
  patientRef?: string

  @IsString()
  @IsNotEmpty()
  toDept: string

  @IsIn(['urgent', 'normal'])
  type: 'urgent' | 'normal'

  @IsString()
  @IsNotEmpty()
  summary: string
}

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.consultationService.list({ status })
  }

  /** 发起会诊（提交即审计留痕） */
  @Post()
  create(@Body() dto: CreateConsultationDto, @CurrentUser() user: JwtUserPayload) {
    return this.consultationService.create(dto, user.username)
  }

  @Post(':id/respond')
  respond(@Param('id') id: string, @Body('opinion') opinion?: string) {
    return this.consultationService.respond(id, opinion)
  }

  @Post(':id/urge')
  urge(@Param('id') id: string) {
    return this.consultationService.urge(id)
  }
}
