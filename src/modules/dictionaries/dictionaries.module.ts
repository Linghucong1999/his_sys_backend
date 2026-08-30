import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DictionariesController } from './dictionaries.controller'
import { DictionariesService } from './dictionaries.service'
import { Dictionary, DictionarySchema } from './schemas/dictionary.schema'

@Module({
  imports: [MongooseModule.forFeature([{ name: Dictionary.name, schema: DictionarySchema }])],
  controllers: [DictionariesController],
  providers: [DictionariesService],
  exports: [DictionariesService]
})
export class DictionariesModule {}
