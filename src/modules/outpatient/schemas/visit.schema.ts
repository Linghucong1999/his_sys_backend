import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose'

export type VisitDocument = HydratedDocument<Visit>

/** 就诊记录：无挂号流程，医师直接建档/调档接诊 */
@Schema({ versionKey: false, timestamps: true })
export class Visit {
  @Prop({ required: true, unique: true, index: true })
  visitNo: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId

  @Prop({ required: true })
  empiId: string

  @Prop({ required: true })
  patientName: string

  @Prop({ required: true, enum: ['first', 'followup'] })
  type: 'first' | 'followup'

  @Prop({ required: true })
  doctorId: string

  @Prop({ required: true })
  doctorName: string

  @Prop({ default: '呼吸内科' })
  department: string

  /** 主诉（建档时一句话，可在病历编辑中细化） */
  @Prop()
  chiefComplaint?: string

  @Prop({ default: 'in_progress', enum: ['in_progress', 'completed'] })
  status: 'in_progress' | 'completed'

  @Prop({ required: true, default: () => new Date() })
  visitedAt: Date
}

export const VisitSchema = SchemaFactory.createForClass(Visit)
