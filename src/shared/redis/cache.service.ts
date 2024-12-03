import type { Redis } from 'ioredis'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable } from '@nestjs/common'
import { Emitter } from '@socket.io/redis-emitter'
import { Cache } from 'cache-manager'

import { RedisIoAdapterKey } from '~/common/adapters/socket.adapter'

import { API_CACHE_PREFIX } from '~/constants/cache.constant'
import { getRedisKey } from '~/utils/redis.util'

// 定义缓存键和缓存结果的类型别名
export type TCacheKey = string
export type TCacheResult<T> = Promise<T | undefined>

// CacheService 类提供缓存相关的操作，包括获取、设置缓存以及缓存清理
@Injectable()
export class CacheService {
  private cache!: Cache

  private ioRedis!: Redis
  // 构造函数注入缓存管理器
  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    this.cache = cache
  }

  // 访问redis客户端的getter方法
  private get redisClient(): Redis {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    return this.cache.store.client
  }

  // 根据键获取缓存
  public get<T>(key: TCacheKey): TCacheResult<T> {
    return this.cache.get(key)
  }

  // 设置缓存，包括键、值和过期时间
  public set(key: TCacheKey, value: any, milliseconds: number) {
    return this.cache.set(key, value, milliseconds)
  }

  // 获取Redis客户端实例
  public getClient() {
    return this.redisClient
  }

  private _emitter: Emitter

  // 使用Redis客户端创建并获取Emitter实例，用于Socket.IO的事件发送
  public get emitter(): Emitter {
    if (this._emitter)
      return this._emitter

    this._emitter = new Emitter(this.redisClient, {
      key: RedisIoAdapterKey,
    })

    return this._emitter
  }

  // 清理所有API缓存键
  public async cleanCatch() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(`${API_CACHE_PREFIX}*`)
    await Promise.all(keys.map(key => redis.del(key)))
  }

  // 清理所有Redis键
  public async cleanAllRedisKey() {
    const redis = this.getClient()
    const keys: string[] = await redis.keys(getRedisKey('*'))

    await Promise.all(keys.map(key => redis.del(key)))
  }
}
