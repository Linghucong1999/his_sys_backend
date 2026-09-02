import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DrugManualController } from './drug-manual.controller'
import { DrugManualService } from './drug-manual.service'
import { DrugManual, DrugManualSchema } from './schemas/drug-manual.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: DrugManual.name, schema: DrugManualSchema }])],
  controllers: [DrugManualController],
  providers: [DrugManualService],
  exports: [DrugManualService]
})
export class DrugManualModule {}
