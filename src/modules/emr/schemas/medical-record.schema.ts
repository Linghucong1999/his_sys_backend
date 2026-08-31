import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>

/** ICD-10 诊断项 */
export interface DiagnosisItem {
  code: string
  name: string
}

/** 病历文书（门诊/入院/处方），支持 CA 签名状态 */
@Schema({ versionKey: false, timestamps: true })
export class MedicalRecord {
  @Prop({ required: true, unique: true, index: true })
  recordNo: string

  @Prop({ required: true, enum: ['outpatient', 'admission', 'prescription'] })
  type: 'outpatient' | 'admission' | 'prescription'

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true, index: true })
  patientId: Types.ObjectId

  @Prop({ required: true })
  patientName: string

  @Prop({ required: true })
  department: string

  @Prop({ required: true })
  doctorName: string

  /** 归属医生（数据权限隔离：医生仅可见自己的病历） */
  @Prop({ index: true })
  doctorId?: string

  @Prop({ index: true })
  visitId?: Types.ObjectId

  @Prop()
  chiefComplaint?: string

  @Prop()
  presentIllness?: string

  @Prop()
  pastHistory?: string

  @Prop()
  physicalExam?: string

  @Prop({ type: [{ code: String, name: String }], default: [] })
  diagnosis: DiagnosisItem[]

  @Prop()
  prescriptionSummary?: string

  @Prop({ default: false, index: true })
  signed: boolean

  @Prop()
  signedAt?: Date

  @Prop()
  signedBy?: string

  @Prop()
  visitedAt?: Date
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord)
