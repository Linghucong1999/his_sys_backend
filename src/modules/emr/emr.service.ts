import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { MedicalRecord, MedicalRecordDocument } from './schemas/medical-record.schema'
import { IdCounterService } from '../id-counter/id-counter.service'
import { Dictionary, DictionaryDocument } from '../dictionaries/schemas/dictionary.schema'

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
  examRequest?: string
  visitedAt?: string
}

@Injectable()
export class EmrService {
  constructor(
    @InjectModel(MedicalRecord.name) private readonly recordModel: Model<MedicalRecordDocument>,
    @InjectModel(Dictionary.name) private readonly dictionaryModel: Model<DictionaryDocument>,
    private readonly idCounter: IdCounterService
  ) {}

  /** 新诊断自学习：写入 ICD-10 字典（去重），后续输入时下拉框可检索到 */
  private async learnDiagnosis(diagnosis: Array<{ code: string; name: string }>): Promise<void> {
    for (const d of diagnosis ?? []) {
      const name = d.name?.trim()
      if (!name) continue
      await this.dictionaryModel.updateOne(
        { category: 'icd10', code: d.code ?? '', name },
        { $setOnInsert: { category: 'icd10', code: d.code ?? '', name } },
        { upsert: true }
      )
    }
  }

  async list(
    query: {
      keyword?: string
      signed?: string
      type?: string
    },
    doctorId?: string
  ): Promise<FlattenMaps<MedicalRecordDocument>[]> {
    const filter = this.buildFilter(query, doctorId)
    return this.recordModel.find(filter).sort({ visitedAt: -1 }).limit(100).lean().exec()
  }

  /** 分页列表（EMR 左侧列表翻页用） */
  async pagedList(
    query: {
      keyword?: string
      signed?: string
      type?: string
      recent?: string
      page?: number
      pageSize?: number
    },
    doctorId?: string
  ): Promise<{ items: FlattenMaps<MedicalRecordDocument>[]; total: number }> {
    const filter = this.buildFilter(query, doctorId)
    const size = Math.min(Math.max(query.pageSize ?? 10, 1), 100)
    const page = Math.max(query.page ?? 1, 1)
    const [items, total] = await Promise.all([
      this.recordModel
        .find(filter)
        .sort({ visitedAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean()
        .exec(),
      this.recordModel.countDocuments(filter)
    ])
    return { items, total }
  }

  private buildFilter(
    query: {
      keyword?: string
      signed?: string
      type?: string
      recent?: string
    },
    doctorId?: string
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {}
    if (doctorId) filter.doctorId = doctorId
    if (query.type) filter.type = query.type
    if (query.signed === 'true') filter.signed = true
    if (query.signed === 'false') filter.signed = false
    if (query.keyword) {
      filter.patientName = { $regex: query.keyword, $options: 'i' }
    }
    if (query.recent === 'true') {
      const from = new Date(Date.now() - 30 * 86400000)
      filter.visitedAt = { $gte: from }
    }
    return filter
  }

  async findById(id: string): Promise<MedicalRecordDocument | null> {
    return this.recordModel.findById(id).exec()
  }

  /** 保存/更新病历（未签名前可编辑） */
  async save(
    input: SaveRecordInput,
    doctorName: string,
    doctorId?: string,
    id?: string
  ): Promise<MedicalRecordDocument> {
    if (id) {
      const doc = await this.recordModel.findById(id).exec()
      if (!doc) throw new NotFoundException('病历不存在')
      if (doc.signed) throw new NotFoundException('病历已 CA 签名，不可修改')
      doc.set(input)
      doc.doctorName = doctorName
      if (doctorId) doc.doctorId = doctorId
      const saved = await doc.save()
      await this.learnDiagnosis(input.diagnosis ?? [])
      return saved
    }
    const created = await this.recordModel.create({
      ...input,
      recordNo: await this.idCounter.nextRecordNo(),
      doctorName,
      doctorId,
      patientId: new Types.ObjectId(input.patientId),
      visitId: input.visitId ? new Types.ObjectId(input.visitId) : undefined,
      visitedAt: input.visitedAt ? new Date(input.visitedAt) : new Date()
    })
    await this.learnDiagnosis(input.diagnosis ?? [])
    return created
  }

  /** CA 电子签名（第一版为模拟签名，落审计由全局拦截器保证） */
  async sign(id: string, signer: { userId: string; username: string }): Promise<MedicalRecordDocument> {
    const doc = await this.recordModel.findById(id).exec()
    if (!doc) throw new NotFoundException('病历不存在')
    if (doc.signed) return doc
    // 服务端三要素校验（前端拦截之外的双保险）：门诊病历/处方/检查申请缺一不可
    const missing: string[] = []
    if (doc.type === 'outpatient') {
      if (!doc.chiefComplaint?.trim()) missing.push('门诊病历（主诉未填写）')
      if (!doc.prescriptionSummary?.trim()) missing.push('处方')
      if (!doc.examRequest?.trim()) missing.push('检查申请')
    } else if (doc.type === 'prescription') {
      if (!doc.prescriptionSummary?.trim()) missing.push('处方')
    } else if (doc.type === 'admission') {
      if (!doc.chiefComplaint?.trim()) missing.push('门诊病历（主诉未填写）')
    }
    if (missing.length > 0) {
      throw new NotFoundException(`以下内容未完成，不可 CA 签名：${missing.join('、')}`)
    }
    doc.signed = true
    doc.signedAt = new Date()
    doc.signedBy = signer.username
    return doc.save()
  }

  async countUnsigned(): Promise<number> {
    return this.recordModel.countDocuments({ signed: false })
  }
}
