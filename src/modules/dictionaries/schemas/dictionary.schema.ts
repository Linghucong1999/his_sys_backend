import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type DictionaryDocument = HydratedDocument<Dictionary>

/** 通用基础字典：ICD-10 诊断、科室、药品目录 */
@Schema({ versionKey: false })
export class Dictionary {
  @Prop({ required: true, enum: ['icd10', 'department', 'drug'], index: true })
  category: 'icd10' | 'department' | 'drug'

  @Prop({ required: true })
  code: string

  @Prop({ required: true, index: true })
  name: string

  /** 扩展信息（药品规格、诊断同义词等） */
  @Prop({ type: Object, default: {} })
  extra?: Record<string, unknown>
}

export const DictionarySchema = SchemaFactory.createForClass(Dictionary)
