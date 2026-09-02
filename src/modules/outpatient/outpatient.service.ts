import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { Visit, VisitDocument } from './schemas/visit.schema'

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
  constructor(@InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>) {}

  private todayRange(): { start: Date; end: Date } {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime() + 86400000)
    return { start, end }
  }

  /** 医师直接接诊（无挂号）：建档/调档后创建就诊记录 */
  async createVisit(input: CreateVisitInput): Promise<VisitDocument> {
    const now = new Date()
    const visitNo = `MZ${now.toISOString().slice(0, 10).replace(/-/g, '')}${String(
      (await this.visitModel.countDocuments()) + 1
    ).padStart(4, '0')}`
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
