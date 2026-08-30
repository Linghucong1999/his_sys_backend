import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EmrController } from './emr.controller'
import { EmrService } from './emr.service'
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema'
import { IdCounterModule } from '../id-counter/id-counter.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MedicalRecord.name, schema: MedicalRecordSchema }]),
    IdCounterModule
  ],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService]
})
export class EmrModule {}
