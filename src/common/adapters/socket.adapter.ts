// 导入NestJS中常用的INestApplication接口，用于表示NestJS应用
import { INestApplication } from '@nestjs/common'
// 导入NestJS的Socket.IO适配器接口
import { IoAdapter } from '@nestjs/platform-socket.io'
// 导入Redis适配器创建方法，用于Socket.IO的Redis适配器
import { createAdapter } from '@socket.io/redis-adapter'

// 导入Redis的发布/订阅常量，用于连接Redis
import { REDIS_PUBSUB } from '~/shared/redis/redis.constant'

// 定义一个常量，用于标识Redis Io适配器的键
export const RedisIoAdapterKey = 'm-shop-socket'

/**
 * RedisIoAdapter类继承自IoAdapter，用于实现Socket.IO与Redis的集成
 * 该适配器用于通过Redis扩展Socket.IO的功能，比如支持群发消息、跨进程通信等
 */
export class RedisIoAdapter extends IoAdapter {
  /**
   * 构造函数，初始化RedisIoAdapter实例
   * @param app INestApplication实例，表示当前的NestJS应用
   */
  constructor(private readonly app: INestApplication) {
    super(app)
  }

  /**
   * 创建并配置Socket.IO服务器，使其使用Redis适配器
   * @param port 服务器监听的端口号
   * @param options Socket.IO服务器的配置选项
   * @returns 返回配置好的Socket.IO服务器实例
   */
  createIOServer(port: number, options?: any) {
    // 调用父类方法创建基础Socket.IO服务器实例
    const server = super.createIOServer(port, options)

    // 从NestJS应用中获取Redis的发布/订阅客户端
    const { pubClient, subClient } = this.app.get(REDIS_PUBSUB)

    // 创建Redis适配器实例，用于Socket.IO服务器
    const redisAdapter = createAdapter(pubClient, subClient, {
      key: RedisIoAdapterKey, // 使用之前定义的适配器键
      requestsTimeout: 10000, // 设置请求超时时间为10秒
    })
    // 为Socket.IO服务器配置Redis适配器
    server.adapter(redisAdapter)
    // 返回配置好的Socket.IO服务器实例
    return server
  }
}
