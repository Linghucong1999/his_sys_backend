import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'
import { Public } from './common/decorators/public.decorator'

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** 服务健康检查（公开接口） */
  @Public()
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  getHealth() {
    return this.appService.getHealth()
  }
}
