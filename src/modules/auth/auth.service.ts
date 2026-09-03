import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { LoginDto } from './dto/login.dto'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

export interface LoginResult {
  token: string
  user: {
    userId: string
    username: string
    realName: string
    roles: string[]
    department?: string
    title?: string
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByUsernameWithPassword(dto.username)
    if (!user || !user.enabled) {
      throw new UnauthorizedException('用户名或密码错误')
    }
    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const payload: JwtUserPayload = {
      userId: user._id.toString(),
      username: user.username,
      roles: user.roles,
      realName: user.realName,
      department: user.department
    }
    return {
      token: await this.jwtService.signAsync(payload),
      user: {
        userId: payload.userId,
        username: user.username,
        realName: user.realName,
        roles: user.roles,
        department: user.department,
        title: user.title
      }
    }
  }
}
