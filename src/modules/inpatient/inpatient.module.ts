import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { InpatientController } from './inpatient.controller'
import { InpatientService } from './inpatient.service'
import { Bed, BedSchema } from './schemas/bed.schema'
import { InpatientOrder, InpatientOrderSchema } from './schemas/inpatient-order.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bed.name, schema: BedSchema },
      { name: InpatientOrder.name, schema: InpatientOrderSchema }
    ])
  ],
  controllers: [InpatientController],
  providers: [InpatientService],
  exports: [InpatientService]
})
export class InpatientModule {}
