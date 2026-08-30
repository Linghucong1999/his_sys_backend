import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type IdCounterDocument = HydratedDocument<IdCounter>

/** ID 计数器：_id 为业务域（如 mrn:20260830），seq 为当前流水号 */
@Schema({ versionKey: false, _id: false })
export class IdCounter {
  @Prop({ type: String, required: true })
  _id: string

  @Prop({ required: true, default: 0 })
  seq: number
}

export const IdCounterSchema = SchemaFactory.createForClass(IdCounter)
