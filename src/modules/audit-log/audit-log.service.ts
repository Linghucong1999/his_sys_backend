import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema'

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>
  ) {}

  async log(entry: Partial<AuditLog>): Promise<void> {
    try {
      await this.auditLogModel.create(entry)
    } catch {
      // 审计写入失败不能影响主业务
    }
  }

  async findAll(skip = 0, limit = 50): Promise<FlattenMaps<AuditLogDocument>[]> {
    return this.auditLogModel
      .find()
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(Math.min(limit, 200))
      .lean()
      .exec()
  }
}
