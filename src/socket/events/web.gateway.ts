// 导入JwtService用于JWT令牌的验证和生成
import { JwtService } from '@nestjs/jwt'
// 导入与WebSocket网关相关的装饰器和接口
import {
  GatewayMetadata,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
// 导入Socket.IO库中的Server类
import { Server } from 'socket.io'
// 导入TokenService用于令牌相关的操作
import { TokenService } from '~/modules/auth/services/token.service'
// 导入CacheService用于缓存操作，例如存储和验证令牌
import { CacheService } from '~/shared/redis/cache.service'
// 导入createAuthGateway函数用于创建带有认证功能的网关
import { createAuthGateway } from '../shared/auth.gateway'

// 使用createAuthGateway创建带有认证功能的AuthGateway
const AuthGateway = createAuthGateway({ namespace: 'web' })
// 定义WebEventsGateway类，继承自AuthGateway，并实现OnGatewayConnection和OnGatewayDisconnect接口
@WebSocketGateway<GatewayMetadata>({ namespace: 'web' })
export class WebEventsGateway
  extends AuthGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  // 构造函数接收JwtService，TokenService和CacheService实例
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly tokenService: TokenService,
    private readonly cacheService: CacheService,
  ) {
    // 调用父类构造函数，传递jwtService, tokenService和cacheService
    super(jwtService, tokenService, cacheService)
  }

  // 使用WebSocketServer装饰器声明_server属性，类型为Server
  @WebSocketServer()
  protected _server: Server

  // 定义server属性的getter，返回_server实例
  get server() {
    return this._server
  }
}
