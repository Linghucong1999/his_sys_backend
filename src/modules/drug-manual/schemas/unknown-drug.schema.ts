import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type UnknownDrugDocument = HydratedDocument<UnknownDrug>

/** 未知药品记录：医生开具了数据库中没有的药品 */
@Schema({ versionKey: false, timestamps: true })
export class UnknownDrug {
  @Prop({ required: true, unique: true, index: true })
  drugName: string

  /** 提及次数 */
  @Prop({ default: 1 })
  count: number

  @Prop()
  doctorId?: string

  @Prop()
  doctorName?: string

  @Prop({ type: Types.ObjectId, ref: 'Patient' })
  patientId?: Types.ObjectId

  @Prop()
  patientName?: string

  @Prop({ default: 'pending', enum: ['pending', 'registered'] })
  status: 'pending' | 'registered'
}

export const UnknownDrugSchema = SchemaFactory.createForClass(UnknownDrug)
