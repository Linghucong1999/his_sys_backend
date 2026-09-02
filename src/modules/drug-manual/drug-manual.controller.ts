import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { DrugManualService } from './drug-manual.service'

class UpsertManualDto {
  @IsString()
  @IsNotEmpty()
  drugName: string

  @IsOptional()
  @IsString()
  genericName?: string

  @IsOptional()
  @IsString()
  spec?: string

  @IsOptional()
  @IsString()
  manufacturer?: string

  @IsOptional()
  @IsString()
  approvalNo?: string

  @IsOptional()
  @IsString()
  indications?: string

  @IsOptional()
  @IsString()
  usage?: string

  @IsOptional()
  @IsString()
  adverseReactions?: string

  @IsOptional()
  @IsString()
  contraindications?: string

  @IsOptional()
  @IsString()
  precautions?: string

  @IsOptional()
  @IsString()
  fullText?: string
}

@ApiTags('drug-manuals')
@ApiBearerAuth()
@Controller('drug-manuals')
export class DrugManualController {
  constructor(private readonly drugManualService: DrugManualService) {}

  @Get()
  list(@Query('keyword') keyword?: string) {
    return this.drugManualService.list(keyword)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drugManualService.findById(id)
  }

  /** 爬虫数据写入（按药名 upsert） */
  @Post('upsert')
  upsert(@Body() dto: UpsertManualDto) {
    return this.drugManualService.upsertByDrugName(dto)
  }
}
