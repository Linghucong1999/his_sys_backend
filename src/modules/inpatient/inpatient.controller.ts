import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { InpatientService } from './inpatient.service'

class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  patientId: string

  @IsString()
  @IsNotEmpty()
  bedNo: string

  @IsIn(['long', 'temp'])
  type: 'long' | 'temp'

  @IsIn(['drug', 'nursing', 'exam'])
  category: 'drug' | 'nursing' | 'exam'

  @IsString()
  @IsNotEmpty()
  content: string

  @IsOptional()
  @IsString()
  frequency?: string
}

@ApiTags('inpatient')
@ApiBearerAuth()
@Controller('inpatient')
export class InpatientController {
  constructor(private readonly inpatientService: InpatientService) {}

  @Get('beds')
  listBeds(@Query('ward') ward?: string) {
    return this.inpatientService.listBeds(ward)
  }

  @Get('orders')
  listOrders(@Query('patientId') patientId?: string, @Query('bedNo') bedNo?: string) {
    return this.inpatientService.listOrders({ patientId, bedNo })
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.inpatientService.createOrder(dto)
  }

  @Post('orders/:id/stop')
  stopOrder(@Param('id') id: string) {
    return this.inpatientService.stopOrder(id)
  }
}
