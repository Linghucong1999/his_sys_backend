import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PatientsController } from './patients.controller'
import { PatientsService } from './patients.service'
import { Patient, PatientSchema } from './schemas/patient.schema'
import { Visit, VisitSchema } from '../outpatient/schemas/visit.schema'
import { IdCounterModule } from '../id-counter/id-counter.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Visit.name, schema: VisitSchema }
    ]),
    IdCounterModule
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService]
})
export class PatientsModule {}
