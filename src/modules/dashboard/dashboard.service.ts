import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import { Visit, VisitDocument } from '../outpatient/schemas/visit.schema'
import { MedicalRecord, MedicalRecordDocument } from '../emr/schemas/medical-record.schema'
import { Consultation, ConsultationDocument } from '../consultation/schemas/consultation.schema'

export interface DashboardSummary {
  todayVisits: number
  followupVisits: number
  firstVisits: number
  pendingSigns: number
  pendingConsultations: number
  activeConsultations: number
  completedConsultationsToday: number
  todoCount: number
}

export interface TodoItem {
  id: string
  icon: string
  title: string
  sub: string
  kind: 'sign' | 'rx' | 'emr' | 'consult' | 'report'
  ref?: string
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    @InjectModel(MedicalRecord.name) private readonly recordModel: Model<MedicalRecordDocument>,
    @InjectModel(Consultation.name) private readonly consultationModel: Model<ConsultationDocument>
  ) {}

  private todayRange(): { start: Date; end: Date } {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return { start, end: new Date(start.getTime() + 86400000) }
  }

  async summary(): Promise<DashboardSummary> {
    const { start, end } = this.todayRange()
    const [total, followup, first, pendingSigns, pendingConsultations, activeConsultations, completedToday] =
      await Promise.all([
        this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end } }),
        this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end }, type: 'followup' }),
        this.visitModel.countDocuments({ visitedAt: { $gte: start, $lt: end }, type: 'first' }),
        this.recordModel.countDocuments({ signed: false }),
        this.consultationModel.countDocuments({ status: 'pending' }),
        this.consultationModel.countDocuments({ status: 'accepted' }),
        this.consultationModel.countDocuments({ status: 'completed', respondedAt: { $gte: start, $lt: end } })
      ])
    return {
      todayVisits: total,
      followupVisits: followup,
      firstVisits: first,
      pendingSigns,
      pendingConsultations,
      activeConsultations,
      completedConsultationsToday: completedToday,
      todoCount: (await this.todos()).length
    }
  }

  /** 待办聚合：仅「病历未完成」+「未编写处方」+「待 CA 签名」三类事项 */
  async todos(): Promise<TodoItem[]> {
    // 接诊中的就诊
    const pendingVisits = await this.visitModel
      .find({ status: 'in_progress' })
      .sort({ visitedAt: -1 })
      .limit(20)
      .lean()
      .exec()
    const withRxIds = await this.recordModel.distinct('patientId', { type: 'prescription' })
    const withRxSet = new Set(withRxIds.map((id) => String(id)))
    const withEmrIds = await this.recordModel.distinct('patientId', { type: 'outpatient' })
    const withEmrSet = new Set(withEmrIds.map((id) => String(id)))
    // 待 CA 签名：未签名病历/处方
    const unsigned = await this.recordModel.find({ signed: false }).sort({ createdAt: -1 }).limit(10).lean().exec()

    const items: TodoItem[] = []
    // 1. 病历未完成（接诊中且尚无门诊病历）
    for (const v of pendingVisits) {
      if (withEmrSet.has(String(v.patientId))) continue
      items.push({
        id: `emr-${String(v._id)}`,
        icon: '📋',
        title: `病历未完成 · ${v.patientName}`,
        sub: `${v.department} · 接诊中`,
        kind: 'emr',
        ref: v.visitNo
      })
    }
    // 2. 未编写处方（接诊中且尚无处方记录）
    for (const v of pendingVisits) {
      if (withRxSet.has(String(v.patientId))) continue
      items.push({
        id: `rx-${String(v._id)}`,
        icon: '💊',
        title: `待开具处方 · ${v.patientName}`,
        sub: `${v.department} · 接诊中`,
        kind: 'rx',
        ref: v.visitNo
      })
    }
    // 3. 待 CA 签名
    for (const r of unsigned) {
      items.push({
        id: String(r._id),
        icon: '🔏',
        title: `${r.type === 'prescription' ? '处方' : '门诊病历'} ${r.recordNo} 待签名`,
        sub: `${r.patientName} · ${r.department}`,
        kind: 'sign',
        ref: r.recordNo
      })
    }
    return items
  }

  async recentRecords(limit = 5): Promise<FlattenMaps<MedicalRecordDocument>[]> {
    return this.recordModel.find().sort({ visitedAt: -1 }).limit(limit).lean().exec()
  }
}
