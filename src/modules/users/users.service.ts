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

  /** 首次启动时创建种子管理员（admin / admin123） */
  async onModuleInit(): Promise<void> {
    const count = await this.userModel.countDocuments()
    if (count === 0) {
      await this.create({
        username: 'admin',
        password: 'admin123',
        realName: '系统管理员',
        roles: ['admin'],
        department: '信息科'
      })
      this.logger.log('已创建初始管理员账号：admin / admin123（请登录后尽快修改）')
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
