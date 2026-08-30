import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHealth(): { status: string; service: string; version: string; uptime: number } {
    return {
      status: 'ok',
      service: 'his-backend',
      version: '0.1.0',
      uptime: process.uptime()
    }
  }
}
