import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EmrController } from './emr.controller'
import { EmrService } from './emr.service'
import { MedicalRecord, MedicalRecordSchema } from './schemas/medical-record.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: MedicalRecord.name, schema: MedicalRecordSchema }])],
  controllers: [EmrController],
  providers: [EmrService],
  exports: [EmrService]
})
export class EmrModule {}
