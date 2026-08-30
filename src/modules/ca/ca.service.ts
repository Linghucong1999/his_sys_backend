import { Injectable } from '@nestjs/common'

@Injectable()
export class CaService {
  /** 占位服务：待 UI 设计稿与业务设计后填充 */
  info(): { module: string; status: string } {
    return { module: '电子签名 CA', status: 'placeholder' }
  }
}
