import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import { DrugManual, DrugManualDocument } from './schemas/drug-manual.schema'

@Injectable()
export class DrugManualService {
  constructor(@InjectModel(DrugManual.name) private readonly manualModel: Model<DrugManualDocument>) {}

  async list(keyword?: string, limit = 100): Promise<FlattenMaps<DrugManualDocument>[]> {
    const filter: Record<string, unknown> = {}
    if (keyword) {
      filter.$or = [
        { drugName: { $regex: keyword, $options: 'i' } },
        { genericName: { $regex: keyword, $options: 'i' } }
      ]
    }
    return this.manualModel.find(filter).sort({ drugName: 1 }).limit(limit).lean().exec()
  }

  async findById(id: string): Promise<DrugManualDocument | null> {
    return this.manualModel.findById(id).exec()
  }

  /** 爬虫/导入批量 upsert（按药名去重更新） */
  async upsertByDrugName(data: Partial<DrugManual>): Promise<DrugManualDocument> {
    if (!data.drugName?.trim()) throw new NotFoundException('缺少药品名称')
    return this.manualModel
      .findOneAndUpdate({ drugName: data.drugName }, { $set: { ...data, source: data.source ?? 'crawl', crawledAt: new Date() } }, { upsert: true, new: true })
      .exec()
  }
}
