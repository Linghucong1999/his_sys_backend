import { Body, Controller, Get, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { Public } from '../../common/decorators/public.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtUserPayload } from '../../common/guards/jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 登录：返回 JWT token 与用户信息 */
  @Public()
  @Post('login')
  @ApiOperation({ summary: '登录' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  /** 获取当前登录用户信息 */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '当前用户信息' })
  profile(@CurrentUser() user: JwtUserPayload) {
    return user
  }
}
