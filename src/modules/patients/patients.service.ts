import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import { Patient, PatientDocument } from './schemas/patient.schema'
import { CreatePatientDto } from './dto/create-patient.dto'

@Injectable()
export class PatientsService {
  constructor(@InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>) {}

  /** 生成主索引号：P + 时间戳 + 3 位随机（骨架实现，后续可换 EMPI 匹配规则） */
  private generateEmpiId(): string {
    const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `P${ts}${rand}`
  }

  async create(dto: CreatePatientDto): Promise<PatientDocument> {
    if (dto.idCardNo) {
      const exists = await this.patientModel.findOne({ idCardNo: dto.idCardNo }).exec()
      if (exists) {
        throw new ConflictException('该身份证号已建档，请勿重复建档')
      }
    }
    return this.patientModel.create({ ...dto, empiId: this.generateEmpiId() })
  }

  async findByIdOrEmpi(id: string): Promise<PatientDocument | null> {
    return this.patientModel
      .findOne({ $or: [{ _id: id }, { empiId: id }, { medicalRecordNo: id }] })
      .exec()
  }

  async search(keyword: string, limit = 20): Promise<FlattenMaps<PatientDocument>[]> {
    return this.patientModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { empiId: keyword },
          { idCardNo: keyword },
          { medicalRecordNo: keyword },
          { phone: keyword }
        ]
      })
      .limit(Math.min(limit, 50))
      .lean()
      .exec()
  }

  async merge(targetEmpiId: string, sourceEmpiId: string): Promise<void> {
    const source = await this.patientModel.findOne({ empiId: sourceEmpiId }).exec()
    if (!source) throw new NotFoundException('待合并档案不存在')
    await this.patientModel.updateOne({ empiId: sourceEmpiId }, { status: 'merged', mergedInto: targetEmpiId })
  }
}
