import type { Redis, RedisOptions } from 'ioredis'
import { Logger } from '@nestjs/common'
import IORedis from 'ioredis'

/**
 * Redis 发布/订阅服务类
 * 用于在应用中实现事件的发布和订阅机制
 */
export class RedisSubPub {
  public pubClient: Redis // 用于发布事件的Redis客户端
  public subClient: Redis // 用于订阅事件的Redis客户端

  /**
   * 构造函数
   * @param redisConfig Redis配置选项
   * @param channelPrefix 事件通道的前缀，默认为'm-shop-channel#'
   */
  constructor(
    private redisConfig: RedisOptions,
    private channelPrefix: string = 'm-shop-channel#',
  ) {
    this.init()
  }

  /**
   * 初始化Redis客户端
   */
  public init() {
    // 创建Redis配置选项，并从构造函数参数中继承必要配置
    const redisOptions: RedisOptions = {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
    }

    // 如果提供了密码，则添加到Redis配置中
    if (this.redisConfig.password)
      redisOptions.password = this.redisConfig.password

    // 创建一个用于发布的Redis客户端实例
    const pubClient = new IORedis(redisOptions)
    // 创建一个用于订阅的Redis客户端实例，它是发布客户端的复制品
    const subClient = pubClient.duplicate()
    this.pubClient = pubClient
    this.subClient = subClient
  }

  /**
   * 发布事件到指定的通道
   * @param event 事件名称
   * @param data 事件数据
   */
  public async publish(event: string, data: any) {
    // 拼接完整的事件通道名称
    const channel = this.channelPrefix + event
    // 将事件数据序列化为JSON字符串
    const _data = JSON.stringify(data)
    // 如果不是日志事件，记录调试信息
    if (event !== 'log')
      Logger.debug(`发布事件：${channel} <- ${_data}`, RedisSubPub.name)

    // 发布事件到Redis通道
    await this.pubClient.publish(channel, _data)
  }

  private ctc = new WeakMap<(data: any) => void, (channel: string, message: string) => void>()

  /**
   * 订阅指定事件的通道
   * @param event 事件名称
   * @param callback 接收到事件数据后的回调函数
   */
  public async subscribe(event: string, callback: (data: any) => void) {
    // 拼接完整的事件通道名称
    const myChannel = this.channelPrefix + event
    // 订阅Redis通道
    this.subClient.subscribe(myChannel)

    // 定义接收到消息后的处理函数
    const cb = (channel, message) => {
      if (channel === myChannel) {
        // 如果不是日志事件，记录调试信息
        if (event !== 'log')
          Logger.debug(`接收事件：${channel} -> ${message}`, RedisSubPub.name)

        // 将接收到的JSON字符串消息解析为对象，并调用回调函数
        callback(JSON.parse(message))
      }
    }

    // 将回调函数与处理函数关联存储在ctc映射中
    this.ctc.set(callback, cb)
    // 注册消息事件监听器
    this.subClient.on('message', cb)
  }

  /**
   * 取消订阅指定事件的通道
   * @param event 事件名称
   * @param callback 接收到事件数据后的回调函数
   */
  public async unsubscribe(event: string, callback: (data: any) => void) {
    // 拼接完整的事件通道名称
    const channel = this.channelPrefix + event
    // 取消订阅Redis通道
    this.subClient.unsubscribe(channel)
    // 获取与回调函数关联的处理函数
    const cb = this.ctc.get(callback)
    if (cb) {
      // 移除消息事件监听器
      this.subClient.off('message', cb)

      // 从ctc映射中删除回调函数与处理函数的关联
      this.ctc.delete(callback)
    }
  }
}
