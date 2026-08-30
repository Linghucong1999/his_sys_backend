import { Module } from '@nestjs/common'
import { OutpatientController } from './outpatient.controller'
import { OutpatientService } from './outpatient.service'

@Module({
  controllers: [OutpatientController],
  providers: [OutpatientService],
  exports: [OutpatientService]
})
export class OutpatientModule {}
