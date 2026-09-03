import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { Consultation, ConsultationDocument } from './schemas/consultation.schema'
import { IdCounterService } from '../id-counter/id-counter.service'

export interface CreateConsultationInput {
  patientId: string
  patientName: string
  patientRef?: string
  fromDept?: string
  toDept: string
  type: 'urgent' | 'normal'
  summary: string
}

@Injectable()
export class ConsultationService {
  constructor(
    @InjectModel(Consultation.name) private readonly consultationModel: Model<ConsultationDocument>,
    private readonly idCounter: IdCounterService
  ) {}

  async list(query: { status?: string }): Promise<FlattenMaps<ConsultationDocument>[]> {
    const filter: Record<string, unknown> = {}
    if (query.status) filter.status = query.status
    return this.consultationModel.find(filter).sort({ createdAt: -1 }).lean().exec()
  }

  async create(input: CreateConsultationInput, doctorName: string): Promise<ConsultationDocument> {
    return this.consultationModel.create({
      ...input,
      consultNo: `CS${String(await this.idCounter.next('consult')).padStart(9, '0')}`,
      patientId: new Types.ObjectId(input.patientId),
      fromDept: input.fromDept || '呼吸内科'
    })
  }

  /** 响应会诊 */
  async respond(id: string, opinion?: string): Promise<ConsultationDocument> {
    const doc = await this.consultationModel.findById(id).exec()
    if (!doc) throw new NotFoundException('会诊申请不存在')
    doc.status = 'accepted'
    doc.respondedAt = new Date()
    if (opinion) doc.opinion = opinion
    return doc.save()
  }

  /** 催办 */
  async urge(id: string): Promise<ConsultationDocument> {
    const doc = await this.consultationModel.findById(id).exec()
    if (!doc) throw new NotFoundException('会诊申请不存在')
    doc.urgeCount += 1
    return doc.save()
  }

  async countPending(): Promise<number> {
    return this.consultationModel.countDocuments({ status: 'pending' })
  }
}
