import { Inject, Injectable } from '@nestjs/common'

import { REDIS_PUBSUB } from './redis.constant'
import { RedisSubPub } from './redis-subpub'

/**
 * RedisPubSubService 类提供了一组方法来处理Redis的发布和订阅功能
 * 它允许在微服务架构中发送和接收消息
 */
@Injectable()
export class RedisPubSubService {
  /**
   * 构造函数，注入RedisSubPub实例
   * @param redisSubPub Redis发布和订阅的服务实例
   */
  constructor(@Inject(REDIS_PUBSUB) private readonly redisSubPub: RedisSubPub) {}

  /**
   * 发布消息到指定频道
   * @param event 频道名称，用于标识消息的类型或目的地
   * @param data 要发送的消息数据，可以是任意类型
   * @returns 通常返回一个Promise，表示消息发布操作的结果
   */
  public async publish(event: string, data: any) {
    return this.redisSubPub.publish(event, data)
  }

  /**
   * 订阅指定频道的消息
   * @param event 频道名称，订阅者将接收此频道的消息
   * @param callback 当频道有新消息时调用的回调函数，接收消息数据作为参数
   * @returns 通常返回一个Promise，表示订阅操作的结果
   */
  public async subscribe(event: string, callback: (data: any) => void) {
    return this.redisSubPub.subscribe(event, callback)
  }

  /**
   * 取消订阅指定频道的消息
   * @param event 频道名称，订阅者将不再接收此频道的消息
   * @param callback 要移除的回调函数，以停止处理频道的消息
   * @returns 通常返回一个Promise，表示取消订阅操作的结果
   */
  public async unsubscribe(event: string, callback: (data: any) => void) {
    return this.redisSubPub.unsubscribe(event, callback)
  }
}
