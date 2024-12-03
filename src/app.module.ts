import type { FastifyRequest } from 'fastify'

import { ClassSerializerInterceptor, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ClsModule } from 'nestjs-cls'

import config from '~/config'
import { SharedModule } from '~/shared/shared.module'

import { AllExceptionsFilter } from './common/filters/any-exception.filter'

import { IdempotenceInterceptor } from './common/interceptors/idempotence.interceptor'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'
import { RbacGuard } from './modules/auth/guards/rbac.guard'
import { HealthModule } from './modules/health/health.module'
import { NetdiskModule } from './modules/netdisk/netdisk.module'
import { SseModule } from './modules/sse/sse.module'
import { SystemModule } from './modules/system/system.module'
import { TasksModule } from './modules/tasks/tasks.module'
import { TodoModule } from './modules/todo/todo.module'
import { ToolsModule } from './modules/tools/tools.module'
import { DatabaseModule } from './shared/database/database.module'

import { SocketModule } from './socket/socket.module'

// 定义应用程序模块
@Module({
  imports: [
    // 配置模块，用于加载环境变量和配置文件
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),
    // CLS上下文模块，用于跨请求上下文传递
    // 使用ClsModule的forRoot方法进行模块初始化配置
    ClsModule.forRoot({
      // 设置模块为全局模式
      global: true,
      // 配置拦截器相关选项
      interceptor: {
        // 启用拦截器功能
        mount: true,
        // 定义拦截器的设置函数
        setup: (cls, context) => {
          // 从请求上下文中获取Fastify请求对象
          const req = context.switchToHttp().getRequest<FastifyRequest<{ Params: { id?: string } }>>()
          // 如果请求参数中的id存在且请求体存在，则将id解析为数字并设置到cls中
          if (req.params?.id && req.body) {
            cls.set('operateId', Number.parseInt(req.params.id))
          }
        },
      },
    }),
    SharedModule,
    DatabaseModule,

    AuthModule,
    SystemModule,
    TasksModule.forRoot(),
    ToolsModule,
    SocketModule,
    HealthModule,
    SseModule,
    NetdiskModule,

    // 业务模块
    // end biz

    TodoModule,
  ],
  providers: [
    // 全局异常过滤器
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // 全局拦截器，用于序列化响应对象
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // 全局拦截器，用于数据转换
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // 全局拦截器，用于设置请求超时
    { provide: APP_INTERCEPTOR, useFactory: () => new TimeoutInterceptor(15 * 1000) },
    // 全局拦截器，用于处理幂等性请求
    { provide: APP_INTERCEPTOR, useClass: IdempotenceInterceptor },

    // 全局守卫，用于JWT认证
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 全局守卫，用于RBAC权限控制
    { provide: APP_GUARD, useClass: RbacGuard },
    // 全局守卫，用于限制请求速率
    { provide: APP_GUARD, useClass: ThrottlerGuard },

  ],
})
export class AppModule { }
