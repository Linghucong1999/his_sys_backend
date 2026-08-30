import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type UserDocument = HydratedDocument<User>

export const HIS_ROLES = ['admin', 'doctor', 'nurse', 'pharmacist', 'manager'] as const

@Schema({ versionKey: false, timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  username: string

  @Prop({ required: true, select: false })
  passwordHash: string

  @Prop({ required: true })
  realName: string

  /** 角色：admin 管理员 / doctor 医生 / nurse 护士 / pharmacist 药师 / manager 管理者 */
  @Prop({ type: [String], required: true })
  roles: string[]

  @Prop()
  department?: string

  @Prop()
  title?: string

  @Prop({ default: true })
  enabled: boolean
}

export const UserSchema = SchemaFactory.createForClass(User)
