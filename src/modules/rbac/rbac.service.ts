import { Injectable } from '@nestjs/common'

@Injectable()
export class RbacService {
  /** 占位服务：待 UI 设计稿与业务设计后填充 */
  info(): { module: string; status: string } {
    return { module: '角色权限管理 RBAC', status: 'placeholder' }
  }
}
