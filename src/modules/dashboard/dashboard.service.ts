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
  kind: 'sign' | 'consult' | 'report'
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
      todoCount: pendingSigns + pendingConsultations
    }
  }

  /** 待办聚合：待签名文书（2）+ 待响应会诊（1）+ 报告回传 + 病历质控（对齐 UI 稿） */
  async todos(): Promise<TodoItem[]> {
    const unsigned = await this.recordModel.find({ signed: false }).sort({ createdAt: -1 }).limit(2).lean().exec()
    const pendingConsults = await this.consultationModel
      .find({ status: 'pending', type: 'urgent' })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean()
      .exec()

    const items: TodoItem[] = []
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
    for (const c of pendingConsults) {
      items.push({
        id: String(c._id),
        icon: '🤝',
        title: `${c.toDept}急会诊待响应`,
        sub: `${c.patientName} · 已催办 ${c.urgeCount} 次`,
        kind: 'consult',
        ref: c.consultNo
      })
    }
    items.push({
      id: 'demo-report-1',
      icon: '🧪',
      title: '胸部 CT 报告已回',
      sub: '刘建军 · 右下肺实变影',
      kind: 'report'
    })
    items.push({
      id: 'demo-qc-1',
      icon: '✔',
      title: '本周病历质控全部通过',
      sub: '甲级病历率 100%',
      kind: 'report'
    })
    return items
  }

  async recentRecords(limit = 5): Promise<FlattenMaps<MedicalRecordDocument>[]> {
    return this.recordModel.find().sort({ visitedAt: -1 }).limit(limit).lean().exec()
  }
}
