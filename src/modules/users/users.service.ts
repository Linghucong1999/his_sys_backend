import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
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

  /** 首次启动时创建种子账号；密码来自环境变量，未配置则随机生成并打印一次性提示 */
  async onModuleInit(): Promise<void> {
    const count = await this.userModel.countDocuments()
    if (count === 0) {
      const env = process.env
      const adminPwd = env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString('hex')
      const staffPwd = env.SEED_STAFF_PASSWORD ?? randomBytes(12).toString('hex')
      const seeds: CreateUserInput[] = [
        { username: 'admin', password: adminPwd, realName: '系统管理员', roles: ['admin'], department: '信息科' },
        { username: 'D1027', password: staffPwd, realName: '王医生', roles: ['doctor'], department: '呼吸内科', title: '主治医师' },
        { username: 'N1001', password: staffPwd, realName: '李护士', roles: ['nurse'], department: '呼吸内科病区', title: '护师' },
        { username: 'P2001', password: staffPwd, realName: '张药师', roles: ['pharmacist'], department: '药剂科', title: '药师' }
      ]
      for (const s of seeds) {
        await this.create(s)
      }
      this.logger.warn(
        `已创建种子账号（密码请立即登录后修改，本提示仅首次出现）：admin/${adminPwd}、D1027/N1001/P2001 密码 ${staffPwd}`
      )
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
