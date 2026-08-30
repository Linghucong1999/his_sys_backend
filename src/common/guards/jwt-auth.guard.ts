import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

/** JWT 载荷中携带的用户信息 */
export interface JwtUserPayload {
  userId: string
  username: string
  roles: string[]
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (isPublic) return true

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUserPayload }>()

    const auth = request.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录或凭证缺失')
    }
    try {
      request.user = await this.jwtService.verifyAsync<JwtUserPayload>(auth.slice(7))
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录')
    }
    return true
  }
}
