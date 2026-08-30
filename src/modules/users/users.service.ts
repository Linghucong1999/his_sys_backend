import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { User, UserDocument } from './schemas/user.schema'

export interface CreateUserInput {
  username: string
  password: string
  realName: string
  roles: string[]
  department?: string
  title?: string
}

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name)

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /** 首次启动时创建种子账号（密码统一 123456） */
  async onModuleInit(): Promise<void> {
    const count = await this.userModel.countDocuments()
    if (count === 0) {
      const seeds: CreateUserInput[] = [
        { username: 'admin', password: 'admin123', realName: '系统管理员', roles: ['admin'], department: '信息科' },
        { username: 'D1027', password: '123456', realName: '王医生', roles: ['doctor'], department: '呼吸内科', title: '主治医师' },
        { username: 'N1001', password: '123456', realName: '李护士', roles: ['nurse'], department: '呼吸内科病区', title: '护师' },
        { username: 'P2001', password: '123456', realName: '张药师', roles: ['pharmacist'], department: '药剂科', title: '药师' }
      ]
      for (const s of seeds) {
        await this.create(s)
      }
      this.logger.log('已创建种子账号：admin/admin123（管理员）、D1027/123456（医生）、N1001/123456（护士）、P2001/123456（药师）')
    }
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(input.password, 10)
    return this.userModel.create({ ...input, passwordHash })
  }

  /** 含密码哈希（仅供认证使用） */
  async findByUsernameWithPassword(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).select('+passwordHash').exec()
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec()
  }

  async findAll(): Promise<FlattenMaps<UserDocument>[]> {
    return this.userModel.find().lean().exec()
  }

  async setEnabled(userId: string, enabled: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { enabled }).exec()
  }
}
