import { ConflictException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { Visit, VisitDocument } from './schemas/visit.schema'
import { MedicalRecord, MedicalRecordDocument } from '../emr/schemas/medical-record.schema'
import { IdCounterService } from '../id-counter/id-counter.service'

export interface CreateVisitInput {
  patientId: string
  empiId: string
  patientName: string
  type: 'first' | 'followup'
  doctorId: string
  doctorName: string
  department?: string
  chiefComplaint?: string
}

@Injectable()
export class OutpatientService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    @InjectModel(MedicalRecord.name) private readonly recordModel: Model<MedicalRecordDocument>,
    private readonly idCounter: IdCounterService
  ) {}

  private todayRange(): { start: Date; end: Date } {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime() + 86400000)
    return { start, end }
  }

  /** 医师直接接诊（无挂号）：建档/调档后创建就诊记录 */
  async createVisit(input: CreateVisitInput): Promise<VisitDocument> {
    // 复诊门禁：仅统计"进行中就诊"关联的未签名文书；历史遗留未签名文书不阻塞复诊
    const activeVisits = await this.visitModel
      .find({ patientId: new Types.ObjectId(input.patientId), status: 'in_progress' }, { _id: 1 })
      .lean()
      .exec()
    const unsignedCount = await this.recordModel.countDocuments({
      patientId: new Types.ObjectId(input.patientId),
      signed: false,
      visitId: { $in: activeVisits.map((v) => v._id) }
    })
    if (unsignedCount > 0) {
      throw new ConflictException(
        `该患者接诊尚未完成：存在 ${unsignedCount} 份待 CA 签名文书，请先完成病历/处方/检查申请并签名后再复诊`
      )
    }
    // 同一患者同一时间只保留一个进行中接诊：旧的 in_progress 就诊置为 completed
    await this.visitModel.updateMany(
      { patientId: new Types.ObjectId(input.patientId), status: 'in_progress' },
      { $set: { status: 'completed' } }
    )
    const now = new Date()
    // 就诊号用原子自增（避免 countDocuments+1 与已有数据撞号导致 E11000）
    const visitNo = await this.idCounter.nextVisitNo(now)
    return this.visitModel.create({
      ...input,
      visitNo,
      patientId: new Types.ObjectId(input.patientId),
      visitedAt: now
    })
  }

  async listToday(): Promise<FlattenMaps<VisitDocument>[]> {
    const { start, end } = this.todayRange()
    return this.visitModel.find({ visitedAt: { $gte: start, $lt: end } }).sort({ visitedAt: -1 }).lean().exec()
  }

  async listByPatient(patientId: string, doctorId?: string): Promise<FlattenMaps<VisitDocument>[]> {
    const filter: Record<string, unknown> = { patientId }
    // 权限隔离：仅返回当前医生接诊的就诊记录
    if (doctorId) filter.doctorId = doctorId
    return this.visitModel.find(filter).sort({ visitedAt: -1 }).lean().exec()
  }

  async countToday(): Promise<{ total: number; followup: number; first: number }> {
    const { start, end } = this.todayRange()
    const [total, followup, first] = await Promise.all([
      this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end } }),
      this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end }, type: 'followup' }),
      this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end }, type: 'first' })
    ])
    return { total, followup, first }
  }
}
