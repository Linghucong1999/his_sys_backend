import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { Patient, PatientSchema } from '../patients/schemas/patient.schema'
import { MedicalRecord, MedicalRecordSchema } from '../emr/schemas/medical-record.schema'
import { Dictionary, DictionarySchema } from '../dictionaries/schemas/dictionary.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: Dictionary.name, schema: DictionarySchema }
    ])
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}
