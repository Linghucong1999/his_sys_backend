import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema'

export interface SaveRecordInput {
  patientId: string
  patientName: string
  type: 'outpatient' | 'admission' | 'prescription'
  department?: string
  visitId?: string
  chiefComplaint?: string
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  diagnosis?: Array<{ code: string; name: string }>
  prescriptionSummary?: string
  visitedAt?: string
}

@Injectable()
export class EmrService {
  constructor(@InjectModel(MedicalRecord.name) private readonly recordModel: Model<MedicalRecordDocument>) {}

  private async genRecordNo(): Promise<string> {
    const now = new Date()
    const seq = (await this.recordModel.countDocuments()) + 1
    return `MZ${now.toISOString().slice(0, 10).replace(/-/g, '')}${String(seq).padStart(4, '0')}`
  }

  async list(query: {
    keyword?: string
    signed?: string
    type?: string
  }): Promise<FlattenMaps<MedicalRecordDocument>[]> {
    const filter: Record<string, unknown> = {}
    if (query.type) filter.type = query.type
    if (query.signed === 'true') filter.signed = true
    if (query.signed === 'false') filter.signed = false
    if (query.keyword) {
      filter.patientName = { $regex: query.keyword, $options: 'i' }
    }
    return this.recordModel.find(filter).sort({ visitedAt: -1 }).limit(100).lean().exec()
  }

  async findById(id: string): Promise<MedicalRecordDocument | null> {
    return this.recordModel.findById(id).exec()
  }

  /** 保存/更新病历（未签名前可编辑） */
  async save(input: SaveRecordInput, doctorName: string, id?: string): Promise<MedicalRecordDocument> {
    if (id) {
      const doc = await this.recordModel.findById(id).exec()
      if (!doc) throw new NotFoundException('病历不存在')
      if (doc.signed) throw new NotFoundException('病历已 CA 签名，不可修改')
      doc.set(input)
      doc.doctorName = doctorName
      return doc.save()
    }
    return this.recordModel.create({
      ...input,
      recordNo: await this.genRecordNo(),
      doctorName,
      patientId: new Types.ObjectId(input.patientId),
      visitId: input.visitId ? new Types.ObjectId(input.visitId) : undefined,
      visitedAt: input.visitedAt ? new Date(input.visitedAt) : new Date()
    })
  }

  /** CA 电子签名（第一版为模拟签名，落审计由全局拦截器保证） */
  async sign(id: string, signer: { userId: string; username: string }): Promise<MedicalRecordDocument> {
    const doc = await this.recordModel.findById(id).exec()
    if (!doc) throw new NotFoundException('病历不存在')
    if (doc.signed) return doc
    doc.signed = true
    doc.signedAt = new Date()
    doc.signedBy = signer.username
    return doc.save()
  }

  async countUnsigned(): Promise<number> {
    return this.recordModel.countDocuments({ signed: false })
  }
}
