import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { Bed, BedDocument } from './schemas/bed.schema'
import { InpatientOrder, InpatientOrderDocument } from './schemas/inpatient-order.schema'

export interface CreateOrderInput {
  patientId: string
  bedNo: string
  type: 'long' | 'temp'
  category: 'drug' | 'nursing' | 'exam'
  content: string
  frequency?: string
}

@Injectable()
export class InpatientService {
  constructor(
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    @InjectModel(InpatientOrder.name) private readonly orderModel: Model<InpatientOrderDocument>
  ) {}

  async listBeds(ward?: string): Promise<FlattenMaps<BedDocument>[]> {
    const filter: Record<string, unknown> = ward ? { ward } : {}
    return this.bedModel
      .find(filter)
      .sort({ bedNo: 1 })
      .populate('patientId', 'name gender birthDate')
      .lean()
      .exec()
  }

  async listOrders(query: { patientId?: string; bedNo?: string }): Promise<FlattenMaps<InpatientOrderDocument>[]> {
    const filter: Record<string, unknown> = {}
    if (query.patientId) filter.patientId = new Types.ObjectId(query.patientId)
    if (query.bedNo) filter.bedNo = query.bedNo
    return this.orderModel.find(filter).sort({ createdAt: 1 }).lean().exec()
  }

  /** 新开医嘱 */
  async createOrder(input: CreateOrderInput): Promise<InpatientOrderDocument> {
    return this.orderModel.create({
      ...input,
      patientId: new Types.ObjectId(input.patientId),
      orderedAt: new Date()
    })
  }

  /** 停嘱 */
  async stopOrder(id: string): Promise<InpatientOrderDocument> {
    const doc = await this.orderModel.findById(id).exec()
    if (!doc) throw new NotFoundException('医嘱不存在')
    doc.status = 'stopped'
    return doc.save()
  }
}
