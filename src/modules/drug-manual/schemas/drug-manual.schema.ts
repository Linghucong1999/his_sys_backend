import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DrugManualDocument = HydratedDocument<DrugManual>

/** 药品说明书库：独立存储爬取/导入的说明书全文数据 */
@Schema({ versionKey: false, timestamps: true })
export class DrugManual {
  @Prop({ required: true, index: true })
  drugName: string

  @Prop({ index: true })
  genericName?: string

  @Prop()
  spec?: string

  @Prop()
  manufacturer?: string

  @Prop()
  approvalNo?: string

  /** 适应症 */
  @Prop()
  indications?: string

  /** 用法用量 */
  @Prop()
  usage?: string

  /** 不良反应 */
  @Prop()
  adverseReactions?: string

  /** 禁忌 */
  @Prop()
  contraindications?: string

  /** 注意事项 */
  @Prop()
  precautions?: string

  /** 说明书全文（未结构化时用） */
  @Prop()
  fullText?: string

  /** 数据来源：seed 种子 / crawl 爬虫 */
  @Prop({ default: 'seed' })
  source?: string

  @Prop()
  crawledAt?: Date
}

export const DrugManualSchema = SchemaFactory.createForClass(DrugManual)
