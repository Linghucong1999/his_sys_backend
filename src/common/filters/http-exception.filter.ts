import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Response } from 'express'

/** 统一异常响应结构：{ code: <HTTP状态码>, data: null, message } */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message = '服务器内部错误'
    if (exception instanceof HttpException) {
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
      } else if (res && typeof res === 'object') {
        const m = (res as Record<string, unknown>).message
        message = Array.isArray(m) ? m.join('；') : String(m ?? exception.message)
      }
    }

    response.status(status).json({ code: status, data: null, message })
  }
}
