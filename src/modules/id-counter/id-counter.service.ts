import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { IdCounter, IdCounterDocument } from './schemas/id-counter.schema'

/**
 * 编号生成服务：基于 MongoDB 原子自增（findOneAndUpdate $inc），
 * 副本集下并发建档/写病历不会重号，唯一索引兜底。
 */
@Injectable()
export class IdCounterService {
  constructor(@InjectModel(IdCounter.name) private readonly counterModel: Model<IdCounterDocument>) {}

  /** 原子自增：返回下一个流水号 */
  async next(scope: string): Promise<number> {
    const doc = await this.counterModel
      .findOneAndUpdate({ _id: scope }, { $inc: { seq: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true })
      .exec()
    return doc.seq
  }

  /** 把计数器抬升到不低于 minSeq（种子数据同步用，避免与演示编号冲突） */
  async bump(scope: string, minSeq: number): Promise<void> {
    await this.counterModel.findOneAndUpdate({ _id: scope }, { $max: { seq: minSeq } }, { upsert: true }).exec()
  }

  private dateStr(d: Date): string {
    // 用本地时间格式化（toISOString 是 UTC，中国时区凌晨会串到前一天）
    const p = (n: number): string => String(n).padStart(2, '0')
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
  }

  /** EMPI 主索引号：P + 9 位全局流水（如 P000000137），与业务/时间解耦 */
  async nextEmpiId(): Promise<string> {
    return `P${String(await this.next('empi')).padStart(9, '0')}`
  }

  /** 院内档案号：DA + yyyyMMdd + 4 位当日流水（如 DA20260830012），跨日自动归零 */
  async nextMedicalRecordNo(d = new Date()): Promise<string> {
    const day = this.dateStr(d)
    return `DA${day}${String(await this.next(`mrn:${day}`)).padStart(4, '0')}`
  }

  /** 病历号：MZ + yyyyMMdd + 4 位当日流水 */
  async nextRecordNo(d = new Date()): Promise<string> {
    const day = this.dateStr(d)
    return `MZ${day}${String(await this.next(`record:${day}`)).padStart(4, '0')}`
  }
}
