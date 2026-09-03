import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type RegionDocument = HydratedDocument<Region>

/** 行政区划节点（省/市/区三级，平铺存储） */
@Schema({ versionKey: false })
export class Region {
  @Prop({ required: true, unique: true })
  code: string

  @Prop({ required: true, index: true })
  name: string

  /** 上级编码（省级为 null） */
  @Prop({ default: null })
  parentCode: string | null

  /** 层级：1 省 / 2 市 / 3 区县 */
  @Prop({ required: true })
  level: number
}

export const RegionSchema = SchemaFactory.createForClass(Region)
