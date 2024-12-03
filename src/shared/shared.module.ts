import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'

import { isDev } from '~/global/env'

import { HelperModule } from './helper/helper.module'
import { LoggerModule } from './logger/logger.module'
import { MailerModule } from './mailer/mailer.module'

import { RedisModule } from './redis/redis.module'

/**
 * 定义一个全局模块 SharedModule，它集合了应用中常用的服务和功能模块
 * 使用 @Global 装饰器将此模块标记为全局模块，可以在任何地方无需额外导入即可使用
 */
@Global()
@Module({
  imports: [
    // logger
    LoggerModule.forRoot(),
    // http
    HttpModule,
    // schedule
    ScheduleModule.forRoot(),
    // rate limit
    ThrottlerModule.forRoot([
      {
        limit: 20,
        ttl: 60000,
      },
    ]),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: isDev,
      ignoreErrors: false,
    }),
    // redis
    RedisModule,
    // mailer
    MailerModule,
    // helper
    HelperModule,
  ],
  exports: [HttpModule, MailerModule, RedisModule, HelperModule],
})
export class SharedModule {}
