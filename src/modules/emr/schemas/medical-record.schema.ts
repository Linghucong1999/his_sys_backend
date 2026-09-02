import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose'

export type MedicalRecordDocument = HydratedDocument<MedicalRecord>

/** ICD-10 诊断项 */
export interface DiagnosisItem {
  code: string
  name: string
}

/** 结构化处方条目 */
export interface RxItem {
  drug: string
  spec?: string
  dose?: string
  frequency?: string
  route?: string
  duration?: string
}

/** 病历文书（门诊/入院/处方），支持 CA 签名状态 */
@Schema({ versionKey: false, timestamps: true })
export class MedicalRecord {
  @Prop({ required: true, unique: true, index: true })
  recordNo: string

  @Prop({ required: true, enum: ['outpatient', 'admission', 'prescription'] })
  type: 'outpatient' | 'admission' | 'prescription'

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true, index: true })
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

  /** 结构化处方条目（新处方表单用；旧数据回退 prescriptionSummary） */
  @Prop({ type: [{ drug: String, spec: String, dose: String, frequency: String, route: String, duration: String }], default: [] })
  prescriptionItems: RxItem[]

  /** 检查申请（CA 签名前置条件之一） */
  @Prop()
  examRequest?: string

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
