import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type PatientDocument = HydratedDocument<Patient>

/** 患者主索引（EMPI）：患者唯一身份标识与档案合并的基础 */
@Schema({ versionKey: false, timestamps: true })
export class Patient {
  /** 主索引号：跨就诊的唯一标识（自动生成或由 EMPI 匹配规则产生） */
  @Prop({ required: true, unique: true, index: true })
  empiId: string

  @Prop({ required: true, index: true })
  name: string

  @Prop({ enum: ['男', '女', '未知'], default: '未知' })
  gender?: string

  @Prop()
  birthDate?: Date

  /** 身份证号（生产环境需加密存储，审计日志已做脱敏） */
  @Prop({ index: true, sparse: true })
  idCardNo?: string

  @Prop()
  phone?: string

  @Prop()
  address?: string

  /** 病历号：院内使用的就诊档案号 */
  @Prop({ index: true, unique: true, sparse: true })
  medicalRecordNo?: string

  /** 医保类型：市职工医保 / 城乡居民医保 / 新农合 / 商业保险 / 自费 */
  @Prop({ default: '自费' })
  insuranceType?: string

  @Prop({ default: 'active', enum: ['active', 'merged', 'inactive'] })
  status?: string

  /** 被合并到的主索引（档案合并时指向新 empiId） */
  @Prop()
  mergedInto?: string
}

export const PatientSchema = SchemaFactory.createForClass(Patient)
