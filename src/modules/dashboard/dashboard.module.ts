import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { Visit, VisitSchema } from '../outpatient/schemas/visit.schema'
import { MedicalRecord, MedicalRecordSchema } from '../emr/schemas/medical-record.schema'
import { Consultation, ConsultationSchema } from '../consultation/schemas/consultation.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: Consultation.name, schema: ConsultationSchema }
    ])
  ],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
