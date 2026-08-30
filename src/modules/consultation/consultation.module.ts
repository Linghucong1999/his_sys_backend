import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConsultationController } from './consultation.controller'
import { ConsultationService } from './consultation.service'
import { Consultation, ConsultationSchema } from './schemas/consultation.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Consultation.name, schema: ConsultationSchema }])],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService]
})
export class ConsultationModule {}
