import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type ConsultationDocument = HydratedDocument<Consultation>

/** 会诊申请：发起科室 → 受邀科室，签名与审计贯穿 */
@Schema({ versionKey: false, timestamps: true })
export class Consultation {
  @Prop({ required: true, unique: true, index: true })
  consultNo: string

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId

  @Prop({ required: true })
  patientName: string

  /** 患者参照号：住院号或档案号 */
  @Prop()
  patientRef?: string

  @Prop({ required: true })
  fromDept: string

  @Prop({ required: true })
  toDept: string

  @Prop({ required: true, enum: ['urgent', 'normal'] })
  type: 'urgent' | 'normal'

  @Prop({ required: true })
  summary: string

  @Prop({ default: 'pending', enum: ['pending', 'accepted', 'completed'], index: true })
  status: 'pending' | 'accepted' | 'completed'

  @Prop({ default: 0 })
  urgeCount: number

  @Prop()
  respondedAt?: Date

  @Prop()
  opinion?: string
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation)
