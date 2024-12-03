import type {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import type { Socket } from 'socket.io'
import { } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { JwtService } from '@nestjs/jwt'
import { WebSocketServer } from '@nestjs/websockets'
import { Namespace } from 'socket.io'

// 导入自定义的常量和服务
import { EventBusEvents } from '~/constants/event-bus.constant'
import { TokenService } from '~/modules/auth/services/token.service'
import { CacheService } from '~/shared/redis/cache.service'
import { BroadcastBaseGateway } from '../base.gateway'
import { BusinessEvents } from '../business-event.constant'

// 定义AuthGateway的配置接口
export interface AuthGatewayOptions {
  namespace: string
}

// 定义IAuthGateway接口，继承WebSocket的连接和断开连接的处理接口
// eslint-disable-next-line ts/ban-ts-comment
// @ts-expect-error
export interface IAuthGateway extends OnGatewayConnection, OnGatewayDisconnect, BroadcastBaseGateway {}

// 创建AuthGateway工厂函数，根据配置生成具体的AuthGateway类
export function createAuthGateway(options: AuthGatewayOptions): new (...args: any[]) => IAuthGateway {
  const { namespace } = options

  // 实现AuthGateway类，继承BroadcastBaseGateway并实现IAuthGateway接口
  class AuthGateway extends BroadcastBaseGateway implements IAuthGateway {
    constructor(
      protected readonly jwtService: JwtService,
      protected readonly tokenService: TokenService,
      private readonly cacheService: CacheService,
    ) {
      super()
    }

    @WebSocketServer()
    protected namespace: Namespace

    // 处理认证失败的逻辑
    async authFailed(client: Socket) {
      client.send(
        this.gatewayMessageFormat(BusinessEvents.AUTH_FAILED, '认证失败'),
      )
      client.disconnect()
    }

    // 验证token的合法性
    async authToken(token: string): Promise<boolean> {
      if (typeof token !== 'string')
        return false

      const validJwt = async () => {
        try {
          const ok = await this.jwtService.verifyAsync(token)

          if (!ok)
            return false
        }
        catch {
          return false
        }
        // is not crash, is verify
        return true
      }

      return await validJwt()
    }

    // 处理客户端连接逻辑
    async handleConnection(client: Socket) {
      const token
        = client.handshake.query.token
        || client.handshake.headers.authorization
        || client.handshake.headers.Authorization
      if (!token)
        return this.authFailed(client)

      if (!(await this.authToken(token as string)))
        return this.authFailed(client)

      super.handleConnect(client)

      const sid = client.id
      this.tokenSocketIdMap.set(token.toString(), sid)
    }

    // 处理客户端断开连接逻辑
    handleDisconnect(client: Socket) {
      super.handleDisconnect(client)
    }

    // 存储token与socket id的映射关系
    tokenSocketIdMap = new Map<string, string>()

    // 处理token过期事件
    @OnEvent(EventBusEvents.TokenExpired)
    handleTokenExpired(token: string) {
      // consola.debug(`token expired: ${token}`)

      const server = this.namespace.server
      const sid = this.tokenSocketIdMap.get(token)
      if (!sid)
        return false

      const socket = server.of(`/${namespace}`).sockets.get(sid)
      if (socket) {
        socket.disconnect()
        super.handleDisconnect(socket)
        return true
      }
      return false
    }

    // 重写广播消息方法
    override broadcast(event: BusinessEvents, data: any) {
      this.cacheService.emitter.of(`/${namespace}`).emit('message', this.gatewayMessageFormat(event, data))
    }
  }

  // 返回生成的AuthGateway类
  return AuthGateway
}
