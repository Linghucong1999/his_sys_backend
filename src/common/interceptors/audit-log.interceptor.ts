import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import type { Request, Response } from 'express'
import { AuditLog } from '../../modules/audit-log/schemas/audit-log.schema'
import type { JwtUserPayload } from '../guards/jwt-auth.guard'

const SENSITIVE_FIELDS = ['password', 'token', 'passwordHash', 'idCardNo', 'secret']

/** 过滤请求体中的敏感字段，避免写入审计日志 */
function sanitizeBody(body: unknown): string | undefined {
  if (body == null) return undefined
  if (typeof body !== 'object') return String(body).slice(0, 2000)
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    cleaned[key] = SENSITIVE_FIELDS.includes(key) ? '[REDACTED]' : value
  }
  const text = JSON.stringify(cleaned)
  return text ? text.slice(0, 2000) : undefined
}

/** 全局操作留痕：每个 HTTP 请求完成后异步写入审计日志（失败不影响主业务） */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(@InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtUserPayload }
    >()
    const startedAt = Date.now()

    const record = (statusCode: number): void => {
      void this.auditLogModel
        .create({
          userId: request.user?.userId,
          username: request.user?.username,
          method: request.method,
          path: request.originalUrl ?? request.url,
          query: request.url?.split('?')[1]?.slice(0, 1000) || undefined,
          body: sanitizeBody(request.body),
          statusCode,
          durationMs: Date.now() - startedAt,
          ip: request.ip ?? request.socket?.remoteAddress,
          userAgent: request.headers['user-agent']?.slice(0, 300)
        })
        .catch(() => {
          // 审计写入失败不影响主业务
        })
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>()
          record(response.statusCode)
        },
        error: () => {
          const response = context.switchToHttp().getResponse<Response>()
          record(response.statusCode)
        }
      })
    )
  }
}
