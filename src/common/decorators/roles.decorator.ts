import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
/** 声明接口所需角色，例如 @Roles('doctor', 'nurse')；不声明则仅要求已登录 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles)
