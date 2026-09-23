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

/** 中药处方用法（煎服法 / 服法 / 剂数） */
export interface HerbalUsage {
  /** 煎服法：水煎服、开水冲服、打粉冲服、外用熏洗 */
  decoction?: string
  /** 服法：每日1剂，分2次温服 */
  usage?: string
  /** 剂数：7剂 */
  doses?: string
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

  /** 医生工号（处方笺打印用） */
  @Prop()
  doctorUsername?: string

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

  /** 生命体征结构化值（单位固定，医生只填数字） */
  @Prop({
    type: { bpHigh: String, bpLow: String, breath: String, temp: String, pulse: String },
    _id: false
  })
  vitals?: {
    bpHigh?: string
    bpLow?: string
    breath?: string
    temp?: string
    pulse?: string
  }

  @Prop({ type: [{ code: String, name: String }], default: [] })
  diagnosis: DiagnosisItem[]

  @Prop()
  prescriptionSummary?: string

  /** 结构化处方条目（新处方表单用；旧数据回退 prescriptionSummary） */
  @Prop({ type: [{ drug: String, spec: String, dose: String, frequency: String, route: String, duration: String }], default: [] })
  prescriptionItems: RxItem[]

  /** 处方类型：western=西药/中成药；herbal=中药饮片 */
  @Prop({ default: 'western', enum: ['western', 'herbal'] })
  prescriptionType?: 'western' | 'herbal'

  /** 中药处方用法（煎服法/服法/剂数；仅 herbal 处方使用） */
  @Prop({ type: { decoction: String, usage: String, doses: String }, _id: false })
  herbalUsage?: HerbalUsage

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
