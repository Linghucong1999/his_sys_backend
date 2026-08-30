import { Injectable } from '@nestjs/common'

@Injectable()
export class DictionariesService {
  /** 占位服务：待 UI 设计稿与业务设计后填充 */
  info(): { module: string; status: string } {
    return { module: '基础字典管理', status: 'placeholder' }
  }
}
