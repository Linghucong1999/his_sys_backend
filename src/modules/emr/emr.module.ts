import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EmrController } from './emr.controller'
import { EmrService } from './emr.service'
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema'
import { Dictionary, DictionarySchema } from '../dictionaries/schemas/dictionary.schema'
import { IdCounterModule } from '../id-counter/id-counter.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MedicalRecord.name, schema: MedicalRecordSchema },
      { name: Dictionary.name, schema: DictionarySchema }
    ]),
    IdCounterModule
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService]
})
export class EmrModule {}
