import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Patient, PatientDocument } from '../patients/schemas/patient.schema'
import { MedicalRecord, MedicalRecordDocument } from '../emr/schemas/medical-record.schema'
import { Dictionary, DictionaryDocument } from '../dictionaries/schemas/dictionary.schema'

export interface SearchResultItem {
  kind: 'patient' | 'record' | 'drug' | 'command'
  title: string
  sub?: string
  ref?: string
  patientId?: string
}

/** Cmd+K 聚合搜索：患者调档 / 病历 / 药品目录 / 功能命令 */
@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    @InjectModel(MedicalRecord.name) private readonly recordModel: Model<MedicalRecordDocument>,
    @InjectModel(Dictionary.name) private readonly dictionaryModel: Model<DictionaryDocument>
  ) {}

  async search(q: string, limit = 8): Promise<SearchResultItem[]> {
    const keyword = (q ?? '').trim()
    if (!keyword) {
      return [
        { kind: 'command', title: '新建首诊档案 · 医师直接创建', sub: '命令' },
        { kind: 'command', title: '发起会诊申请', sub: '功能' },
        { kind: 'command', title: '待签名文档', sub: '功能' }
      ]
    }
    const rx = { $regex: keyword, $options: 'i' }
    const [patients, records, drugs] = await Promise.all([
      this.patientModel
        .find({ $or: [{ name: rx }, { phone: keyword }, { empiId: keyword }, { medicalRecordNo: keyword }] })
        .limit(5)
        .lean()
        .exec(),
      this.recordModel.find({ patientName: rx }).sort({ visitedAt: -1 }).limit(5).lean().exec(),
      this.dictionaryModel.find({ category: 'drug', $or: [{ name: rx }, { code: keyword }] }).limit(5).lean().exec()
    ])

    const items: SearchResultItem[] = []
    for (const p of patients) {
      items.push({
        kind: 'patient',
        title: `${p.name} · ${p.phone ?? ''} · ${p.gender ?? ''}`,
        sub: '调档接诊',
        ref: p.empiId,
        patientId: String(p._id)
      })
    }
    for (const r of records) {
      items.push({
        kind: 'record',
        title: `${r.patientName} · ${r.recordNo} · ${r.diagnosis?.[0]?.name ?? ''}`,
        sub: '病历',
        ref: r.recordNo,
        patientId: String(r.patientId)
      })
    }
    for (const d of drugs) {
      items.push({
        kind: 'drug',
        title: `${d.name} · ${(d.extra as Record<string, string>)?.spec ?? ''}`,
        sub: '药品目录',
        ref: d.code
      })
    }
    return items.slice(0, limit)
  }
}
