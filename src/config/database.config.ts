import { ConfigType, registerAs } from '@nestjs/config'

import dotenv from 'dotenv'

import { DataSource, DataSourceOptions } from 'typeorm'

import { env, envBoolean, envNumber } from '~/global/env'

// 根据当前环境配置加载 .env 文件
dotenv.config({ path: `.env.${process.env.NODE_ENV}` })

// 当前通过 npm scripts 执行的命令
const currentScript = process.env.npm_lifecycle_event

// 数据源配置选项
const dataSourceOptions: DataSourceOptions = {
  type: 'mysql', // 数据库类型
  host: env('DB_HOST', '127.0.0.1'), // 数据库主机地址
  port: envNumber('DB_PORT', 3306), // 数据库端口
  username: env('DB_USERNAME'), // 数据库用户名
  password: env('DB_PASSWORD'), // 数据库密码
  database: env('DB_DATABASE'), // 数据库名称
  synchronize: envBoolean('DB_SYNCHRONIZE', false), // 同步数据库模型
  // 解决通过 pnpm migration:run 初始化数据时，遇到的 SET FOREIGN_KEY_CHECKS = 0; 等语句报错问题, 仅在执行数据迁移操作时设为 true
  multipleStatements: currentScript === 'typeorm',
  entities: ['dist/modules/**/*.entity{.ts,.js}'], // 实体文件路径
  migrations: ['dist/migrations/*{.ts,.js}'], // 迁移文件路径
  subscribers: ['dist/modules/**/*.subscriber{.ts,.js}'], // 订阅器文件路径
}
// 数据源注册令牌
export const dbRegToken = 'database'

// 注册数据库配置
export const DatabaseConfig = registerAs(
  dbRegToken,
  (): DataSourceOptions => dataSourceOptions,
)

// 数据库配置类型定义
export type IDatabaseConfig = ConfigType<typeof DatabaseConfig>

// 创建数据源实例
const dataSource = new DataSource(dataSourceOptions)

// 默认导出数据源实例
export default dataSource
