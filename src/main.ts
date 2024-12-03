import type { ConfigKeyPaths } from './config'

// 导入必要的模块和工具
import cluster from 'node:cluster'
import path from 'node:path'
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { NestFactory } from '@nestjs/core'

import { NestFastifyApplication } from '@nestjs/platform-fastify'

import { useContainer } from 'class-validator'
import { AppModule } from './app.module'
import { fastifyApp } from './common/adapters/fastify.adapter'
import { RedisIoAdapter } from './common/adapters/socket.adapter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { isDev, isMainProcess } from './global/env'
import { setupSwagger } from './setup-swagger'
import { LoggerService } from './shared/logger.service'

declare const module: any

/**
 * 应用程序启动函数
 * 负责创建 Nest 应用程序实例，配置全局设置，以及启动服务
 */
async function bootstrap() {
  // 创建 Nest 应用程序实例，使用 Fastify 作为默认中间件
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyApp,
    {
      bufferLogs: true,
      snapshot: true,
      // forceCloseConnections: true,
    },
  )

  // 获取配置服务
  const configService = app.get(ConfigService<ConfigKeyPaths>)

  // 从配置中获取应用的端口和全局前缀
  const { port, globalPrefix } = configService.get('app', { infer: true })

  // 在 DTO 类中注入 Nest 容器的依赖，用于自定义验证器
  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  // 全局启用 CORS，允许所有来源，并开启凭证传输
  app.enableCors({ origin: '*', credentials: true })
  // 设置全局路由前缀
  app.setGlobalPrefix(globalPrefix)
  // 挂载静态资源
  app.useStaticAssets({ root: path.join(__dirname, '..', 'public') })
  // 在生产环境中启用关闭钩子
  !isDev && app.enableShutdownHooks()

  // 在开发环境中使用日志拦截器
  if (isDev) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  // 全局使用验证管道，用于数据转换和验证
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      stopAtFirstError: true,
      exceptionFactory: errors =>
        new UnprocessableEntityException(
          errors.map((e) => {
            const rule = Object.keys(e.constraints!)[0]
            const msg = e.constraints![rule]
            return msg
          })[0],
        ),
    }),
  )

  // 使用 Redis 作为 WebSocket 适配器
  app.useWebSocketAdapter(new RedisIoAdapter(app))

  // 配置 Swagger 文档
  setupSwagger(app, configService)

  // 监听指定端口，启动应用服务
  await app.listen(port, '0.0.0.0', async () => {
    // 使用自定义日志服务
    app.useLogger(app.get(LoggerService))
    const url = await app.getUrl()
    const { pid } = process
    const env = cluster.isPrimary
    const prefix = env ? 'P' : 'W'

    // 只在主进程中打印启动日志
    if (!isMainProcess)
      return

    const logger = new Logger('NestApplication')
    logger.log(`[${prefix + pid}] Server running on ${url}`)

    // 在开发环境中打印 Swagger 文档地址
    if (isDev)
      logger.log(`[${prefix + pid}] OpenAPI: ${url}/api-docs`)
  })

  // 在模块热更新环境下进行处理
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

// 调用启动函数，开始应用程序
bootstrap()
