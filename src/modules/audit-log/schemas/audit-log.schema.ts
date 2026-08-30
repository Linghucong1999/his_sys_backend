import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AuditLogDocument = HydratedDocument<AuditLog>

/** 操作审计日志：谁在什么时间通过什么接口做了什么（合规刚需） */
@Schema({ versionKey: false })
export class AuditLog {
  @Prop({ index: true })
  userId?: string

  @Prop()
  username?: string

  @Prop({ required: true })
  method: string

  @Prop({ required: true, index: true })
  path: string

  @Prop()
  query?: string

  /** 请求体摘要（已过滤 password/token 等敏感字段） */
  @Prop()
  body?: string

  @Prop({ index: true })
  statusCode?: number

  @Prop()
  durationMs?: number

  @Prop()
  ip?: string

  @Prop()
  userAgent?: string

  @Prop({ required: true, default: () => new Date(), expires: '180d' })
  occurredAt: Date
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog)
