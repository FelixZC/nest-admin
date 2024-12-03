import { BeforeApplicationShutdown, Controller, Headers, Ip, Param, ParseIntPipe, Req, Res, Sse } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { FastifyReply, FastifyRequest } from 'fastify'

import { interval, Observable } from 'rxjs'

import { ApiSecurityAuth } from '~/common/decorators/swagger.decorator'

import { OnlineService } from '../system/online/online.service'
import { MessageEvent, SseService } from './sse.service'

// 标记该控制器属于系统模块的SSE部分，并设置安全认证
@ApiTags('System - sse模块')
@ApiSecurityAuth()
@SkipThrottle()
@Controller('sse')
export class SseController implements BeforeApplicationShutdown {
  // 用于存储用户ID与回复对象的映射，以便在用户断开连接时正确处理
  private replyMap: Map<number, FastifyReply> = new Map()

  constructor(private readonly sseService: SseService, private onlineService: OnlineService) { }

  // 关闭所有用户连接的方法，用于程序关闭前清理所有连接
  private closeAllConnect() {
    // 向所有用户发送关闭连接的消息
    this.sseService.sendToAllUser({
      type: 'close',
      data: 'bye~',
    })
    // 遍历并关闭所有用户的回复对象
    this.replyMap.forEach((reply) => {
      reply.raw.end().destroy()
    })
  }

  // 实现BeforeApplicationShutdown接口，确保在应用关闭时调用closeAllConnect方法
  beforeApplicationShutdown() {
    this.closeAllConnect()
  }

  @ApiOperation({ summary: '服务端推送消息' })
  @Sse(':uid')
  async sse(
    @Param('uid', ParseIntPipe) uid: number,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Ip() ip: string,
    @Headers('user-agent') ua: string,
  ): Promise<Observable<MessageEvent>> {
    // 将用户ID与回复对象映射存储，以便后续使用
    this.replyMap.set(uid, res)
    // 记录在线用户信息
    this.onlineService.addOnlineUser(req.accessToken, ip, ua)

    return new Observable((subscriber) => {
      // 定时推送心跳消息，保持连接
      const subscription = interval(12000).subscribe(() => {
        subscriber.next({ type: 'ping' })
      })
      // 将用户添加到SSE服务中，以便可以向其推送消息
      this.sseService.addClient(uid, subscriber)

      // 监听客户端关闭事件，以便在断开连接时进行清理
      req.raw.on('close', () => {
        subscription.unsubscribe()
        this.sseService.removeClient(uid, subscriber)
        this.replyMap.delete(uid)
        this.onlineService.removeOnlineUser(req.accessToken)
        console.log(`user-${uid}已关闭`)
      })
    })
  }
}
