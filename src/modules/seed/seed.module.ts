import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SeedService } from './seed.service'
import { Patient, PatientSchema } from '../patients/schemas/patient.schema'
import { Visit, VisitSchema } from '../outpatient/schemas/visit.schema'
import { MedicalRecord, MedicalRecordSchema } from '../emr/schemas/medical-record.schema'
import { Consultation, ConsultationSchema } from '../consultation/schemas/consultation.schema'
import { Bed, BedSchema } from '../inpatient/schemas/bed.schema'
import { InpatientOrder, InpatientOrderSchema } from '../inpatient/schemas/inpatient-order.schema'
import { Dictionary, DictionarySchema } from '../dictionaries/schemas/dictionary.schema'
import { IdCounterModule } from '../id-counter/id-counter.module'
import { User, UserSchema } from '../users/schemas/user.schema'
import { DrugManual, DrugManualSchema } from '../drug-manual/schemas/drug-manual.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: Consultation.name, schema: ConsultationSchema },
      { name: Bed.name, schema: BedSchema },
      { name: InpatientOrder.name, schema: InpatientOrderSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      { name: User.name, schema: UserSchema },
      { name: DrugManual.name, schema: DrugManualSchema }
    ]),
    IdCounterModule
  ],
  providers: [SeedService]
})
export class SeedModule {}
