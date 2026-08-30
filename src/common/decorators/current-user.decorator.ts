import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { JwtUserPayload } from '../guards/jwt-auth.guard'

/** 取当前登录用户（来自 JWT），@CurrentUser() 取整体，@CurrentUser('username') 取字段 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtUserPayload | undefined, ctx: ExecutionContext): JwtUserPayload | string | string[] => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>()
    const user = request.user
    if (!user) {
      throw new Error('CurrentUser used outside JwtAuthGuard scope')
    }
    return data ? user[data] : user
  }
)
