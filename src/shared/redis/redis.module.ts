import { RedisModule as NestRedisModule, RedisService } from '@liaoliaots/nestjs-redis'
import { CacheModule } from '@nestjs/cache-manager'
import { Global, Module, Provider } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

// 导入 Redis 存储和配置相关类型
import { redisStore } from 'cache-manager-ioredis-yet'
import { RedisOptions } from 'ioredis'

import { REDIS_CLIENT } from '~/common/decorators/inject-redis.decorator'

import { ConfigKeyPaths, IRedisConfig } from '~/config'
import { CacheService } from './cache.service'
import { REDIS_PUBSUB } from './redis.constant'
import { RedisSubPub } from './redis-subpub'
import { RedisPubSubService } from './subpub.service'

// 定义模块的提供者数组
const providers: Provider[] = [
  CacheService,
  {
    // 创建 REDIS_PUBSUB 提供者，用于处理 Redis 的发布/订阅功能
    provide: REDIS_PUBSUB,
    useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
      const redisOptions: RedisOptions = configService.get<IRedisConfig>('redis')
      return new RedisSubPub(redisOptions)
    },
    inject: [ConfigService],
  },
  RedisPubSubService,
  {
    provide: REDIS_CLIENT,
    useFactory: (redisService: RedisService) => {
      return redisService.getOrThrow()
    },
    inject: [RedisService], // 注入 RedisService
  },
]

// 定义全局 Redis 模块
@Global()
@Module({
  imports: [
    // 配置缓存模块
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const redisOptions: RedisOptions = configService.get<IRedisConfig>('redis')

        return {
          isGlobal: true,
          store: redisStore,
          isCacheableValue: () => true,
          ...redisOptions,
        }
      },
      inject: [ConfigService],
    }),
    // 配置 Redis 模块
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        readyLog: true,
        config: configService.get<IRedisConfig>('redis'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers,
  exports: [...providers, CacheModule],
})
// 导出 Redis 模块
export class RedisModule {}
