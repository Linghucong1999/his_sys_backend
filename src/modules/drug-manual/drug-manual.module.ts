import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DrugManualController } from './drug-manual.controller'
import { DrugManualService } from './drug-manual.service'
import { DrugManual, DrugManualSchema } from './schemas/drug-manual.schema'
import { UnknownDrug, UnknownDrugSchema } from './schemas/unknown-drug.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DrugManual.name, schema: DrugManualSchema },
      { name: UnknownDrug.name, schema: UnknownDrugSchema }
    ])
  ],
  controllers: [DrugManualController],
  providers: [DrugManualService],
  exports: [DrugManualService]
})
export class DrugManualModule {}
