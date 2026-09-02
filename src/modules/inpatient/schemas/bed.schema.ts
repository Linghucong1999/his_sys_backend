import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose'

export type BedDocument = HydratedDocument<Bed>

/** 住院床位 */
@Schema({ versionKey: false, timestamps: true })
export class Bed {
  @Prop({ required: true, index: true })
  bedNo: string

  @Prop({ required: true, index: true })
  ward: string

  @Prop({ required: true, enum: ['occupied', 'empty'], index: true })
  status: 'occupied' | 'empty'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient' })
  patientId?: Types.ObjectId

  @Prop()
  patientName?: string

  @Prop()
  admissionNo?: string

  /** 床位标注：normal / postop 术后 / leaving 今日出院 */
  @Prop({ default: 'normal', enum: ['normal', 'postop', 'leaving'] })
  flag?: 'normal' | 'postop' | 'leaving'

  /** 患者简要诊断/备注 */
  @Prop()
  note?: string
}

export const BedSchema = SchemaFactory.createForClass(Bed)
