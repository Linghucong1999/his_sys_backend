import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose'

export type InpatientOrderDocument = HydratedDocument<InpatientOrder>

/** 住院医嘱（长期/临时） */
@Schema({ versionKey: false, timestamps: true })
export class InpatientOrder {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId

  @Prop({ required: true, index: true })
  bedNo: string

  @Prop({ required: true, enum: ['long', 'temp'], index: true })
  type: 'long' | 'temp'

  @Prop({ required: true, enum: ['drug', 'nursing', 'exam'] })
  category: 'drug' | 'nursing' | 'exam'

  @Prop({ required: true })
  content: string

  /** 频次/用法说明，如 q8h · ivgtt */
  @Prop()
  frequency?: string

  @Prop({ default: 'active', enum: ['active', 'stopped', 'done'] })
  status: 'active' | 'stopped' | 'done'

  @Prop()
  orderedAt?: Date
}

export const InpatientOrderSchema = SchemaFactory.createForClass(InpatientOrder)
