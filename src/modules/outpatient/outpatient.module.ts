import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { OutpatientController } from './outpatient.controller'
import { OutpatientService } from './outpatient.service'
import { Visit, VisitSchema } from './schemas/visit.schema'
import { MedicalRecord, MedicalRecordSchema } from '../emr/schemas/medical-record.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: MedicalRecord.name, schema: MedicalRecordSchema }
    ])
  ],
  controllers: [OutpatientController],
  providers: [OutpatientService],
  exports: [OutpatientService]
})
export class OutpatientModule {}
