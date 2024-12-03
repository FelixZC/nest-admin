import { Module } from '@nestjs/common'

import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DataSource, LoggerOptions } from 'typeorm'

import { ConfigKeyPaths, IDatabaseConfig } from '~/config'

import { env } from '~/global/env'

import { EntityExistConstraint } from './constraints/entity-exist.constraint'
import { UniqueConstraint } from './constraints/unique.constraint'
import { TypeORMLogger } from './typeorm-logger'

// 定义数据库模块的提供者
const providers = [EntityExistConstraint, UniqueConstraint]

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        // 初始化日志配置
        let loggerOptions: LoggerOptions = env('DB_LOGGING') as 'all'

        try {
          // 尝试将日志配置解析为JSON数组
          loggerOptions = JSON.parse(loggerOptions)
        }
        catch {
          // 如果解析失败，则忽略错误
        }

        // 返回数据库配置
        return {
          ...configService.get<IDatabaseConfig>('database'),
          autoLoadEntities: true,
          logging: loggerOptions,
          logger: new TypeORMLogger(loggerOptions),
        }
      },
      // 数据源工厂函数，用于创建和初始化数据源
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize()
        return dataSource
      },
    }),
  ],
  providers,
  exports: providers,
})
// 定义数据库模块，负责数据库连接和配置
export class DatabaseModule {}
