// 导入JwtService用于JWT令牌的验证和解码
import { JwtService } from '@nestjs/jwt'
// 导入WebSocketGateway相关装饰器和接口
import {
  GatewayMetadata,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
// 导入Socket.IO的Server类
import { Server } from 'socket.io'
// 导入AuthService用于用户身份验证
import { AuthService } from '~/modules/auth/auth.service'
// 导入CacheService用于缓存操作
import { CacheService } from '~/shared/redis/cache.service'
// 导入createAuthGateway函数用于创建带有身份验证功能的Gateway
import { createAuthGateway } from '../shared/auth.gateway'

// 使用createAuthGateway函数创建带有身份验证功能的Gateway
const AuthGateway = createAuthGateway({ namespace: 'admin' })

// 定义AdminEventsGateway类，继承自AuthGateway，并实现OnGatewayConnection和OnGatewayDisconnect接口
@WebSocketGateway<GatewayMetadata>({ namespace: 'admin' })
export class AdminEventsGateway
  extends AuthGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  // 构造函数，注入JwtService，AuthService和CacheService
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly authService: AuthService,
    private readonly cacheService: CacheService,
  ) {
    // 调用父类构造函数，初始化身份验证所需的依赖
    super(jwtService, authService, cacheService)
  }

  // 使用WebSocketServer装饰器，获取Socket.IO的Server实例
  @WebSocketServer()
  protected _server: Server

  // 定义server属性的getter，用于获取Socket.IO的Server实例
  get server() {
    return this._server
  }
}
