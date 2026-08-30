import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { Patient, PatientDocument } from './schemas/patient.schema'
import { Visit, VisitDocument } from '../outpatient/schemas/visit.schema'
import { CreatePatientDto } from './dto/create-patient.dto'
import { IdCounterService } from '../id-counter/id-counter.service'

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    private readonly idCounter: IdCounterService
  ) {}

  async create(dto: CreatePatientDto): Promise<PatientDocument> {
    if (dto.idCardNo) {
      const exists = await this.patientModel.findOne({ idCardNo: dto.idCardNo }).exec()
      if (exists) {
        throw new ConflictException('该身份证号已建档，请勿重复建档')
      }
    }
    // EMPI 主索引号：P+9 位全局流水；档案号：DA+日期+4 位当日流水（均原子自增，无重号）
    return this.patientModel.create({
      ...dto,
      empiId: await this.idCounter.nextEmpiId(),
      medicalRecordNo: dto.medicalRecordNo ?? (await this.idCounter.nextMedicalRecordNo())
    })
  }

  async findByIdOrEmpi(id: string): Promise<PatientDocument | null> {
    return this.patientModel
      .findOne({ $or: [{ _id: id }, { empiId: id }, { medicalRecordNo: id }] })
      .exec()
  }

  async search(keyword: string, limit = 20): Promise<FlattenMaps<PatientDocument>[]> {
    // 支持姓名 / 手机号 / 姓名+手机号组合（空格分隔，各片段 AND 匹配）
    const tokens = keyword.trim().split(/\s+/).filter(Boolean)
    const filter = this.buildSearchFilter(tokens)
    return this.patientModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean()
      .exec()
  }

  /** 分页列表（患者一览翻页用）：仅当前医生接诊过的患者，按建档时间倒序 */
  async pagedList(
    page = 1,
    pageSize = 10,
    doctorId?: string
  ): Promise<{ items: FlattenMaps<PatientDocument>[]; total: number }> {
    const size = Math.min(Math.max(pageSize, 1), 50)
    let filter: Record<string, unknown> = {}
    if (doctorId) {
      const patientIds = await this.visitModel.distinct('patientId', { doctorId })
      filter = { _id: { $in: patientIds } }
    }
    const [items, total] = await Promise.all([
      this.patientModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * size)
        .limit(size)
        .lean()
        .exec(),
      this.patientModel.countDocuments(filter)
    ])
    return { items, total }
  }

  private buildSearchFilter(tokens: string[]): Record<string, unknown> {
    if (tokens.length === 0) return {}
    const conds = tokens.map((t) => ({
      $or: [
        { name: { $regex: t, $options: 'i' } },
        { phone: { $regex: t } },
        { empiId: t },
        { medicalRecordNo: t }
      ]
    }))
    return tokens.length > 1 ? { $and: conds } : conds[0]
  }

  async merge(targetEmpiId: string, sourceEmpiId: string): Promise<void> {
    const source = await this.patientModel.findOne({ empiId: sourceEmpiId }).exec()
    if (!source) throw new NotFoundException('待合并档案不存在')
    await this.patientModel.updateOne({ empiId: sourceEmpiId }, { status: 'merged', mergedInto: targetEmpiId })
  }
}
