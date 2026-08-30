import { Injectable } from '@nestjs/common'

@Injectable()
export class InpatientService {
  /** 占位服务：待 UI 设计稿与业务设计后填充 */
  info(): { module: string; status: string } {
    return { module: '住院医生工作站', status: 'placeholder' }
  }
}
