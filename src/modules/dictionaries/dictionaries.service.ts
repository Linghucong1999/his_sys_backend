import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import { Dictionary, DictionaryDocument } from './schemas/dictionary.schema'

@Injectable()
export class DictionariesService {
  constructor(@InjectModel(Dictionary.name) private readonly dictionaryModel: Model<DictionaryDocument>) {}

  async listByCategory(category: string, keyword?: string): Promise<FlattenMaps<DictionaryDocument>[]> {
    const filter: Record<string, unknown> = { category }
    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' }
    }
    return this.dictionaryModel.find(filter).limit(50).lean().exec()
  }
}
