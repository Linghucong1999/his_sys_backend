import { Injectable } from '@nestjs/common'

@Injectable()
export class OutpatientService {
  /** 占位服务：待 UI 设计稿与业务设计后填充 */
  info(): { module: string; status: string } {
    return { module: '门急诊医生工作站', status: 'placeholder' }
  }
}
