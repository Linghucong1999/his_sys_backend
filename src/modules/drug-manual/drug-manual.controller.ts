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
  category?: string

  @IsOptional()
  @IsString()
  fullText?: string

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
}

@ApiTags('drug-manuals')
@ApiBearerAuth()
@Controller('drug-manuals')
export class DrugManualController {
  constructor(private readonly drugManualService: DrugManualService) {}

  @Get('categories')
  categories() {
    return this.drugManualService.listCategories()
  }

  /** 未知药品列表（医生开过但药库中没有的） */
  @Get('unknown')
  unknownList() {
    return this.drugManualService.listUnknown()
  }

  /** 注册新药入库（自动按药理词根分类） */
  @Post('register')
  register(@Body() dto: UpsertManualDto) {
    return this.drugManualService.registerDrug({
      drugName: dto.drugName,
      spec: dto.spec,
      category: dto.category,
      fullText: dto.fullText
    })
  }

  @Get()
  list(@Query('keyword') keyword?: string, @Query('source') source?: string, @Query('category') category?: string) {
    return this.drugManualService.list(keyword, source, category)
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
