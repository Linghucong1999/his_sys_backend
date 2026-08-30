import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { IdCounterService } from './id-counter.service'
import { IdCounter, IdCounterSchema } from './schemas/id-counter.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: IdCounter.name, schema: IdCounterSchema }])],
  providers: [IdCounterService],
  exports: [IdCounterService]
})
export class IdCounterModule {}
