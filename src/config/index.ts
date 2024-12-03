// 从各个配置文件中导入相应的配置类和接口
import { AppConfig, appRegToken, IAppConfig } from './app.config'
import { DatabaseConfig, dbRegToken, IDatabaseConfig } from './database.config'
import { IMailerConfig, MailerConfig, mailerRegToken } from './mailer.config'
import { IOssConfig, OssConfig, ossRegToken } from './oss.config'
import { IRedisConfig, RedisConfig, redisRegToken } from './redis.config'
import { ISecurityConfig, SecurityConfig, securityRegToken } from './security.config'
import { ISwaggerConfig, SwaggerConfig, swaggerRegToken } from './swagger.config'

// 导出所有配置文件，以便其他模块可以通过这些路径引用配置
export * from './app.config'
export * from './database.config'
export * from './mailer.config'
export * from './oss.config'
export * from './redis.config'
export * from './security.config'
export * from './swagger.config'

// 定义一个接口，用于汇总所有配置类型的映射
export interface AllConfigType {
  [appRegToken]: IAppConfig
  [dbRegToken]: IDatabaseConfig
  [mailerRegToken]: IMailerConfig
  [redisRegToken]: IRedisConfig
  [securityRegToken]: ISecurityConfig
  [swaggerRegToken]: ISwaggerConfig
  [ossRegToken]: IOssConfig
}

// 定义一个类型，用于记录所有配置项的键路径
export type ConfigKeyPaths = RecordNamePaths<AllConfigType>

// 默认导出一个对象，汇总了所有配置类的引用
export default {
  AppConfig,
  DatabaseConfig,
  MailerConfig,
  OssConfig,
  RedisConfig,
  SecurityConfig,
  SwaggerConfig,
}
