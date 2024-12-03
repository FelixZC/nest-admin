import { ConfigType, registerAs } from '@nestjs/config'

import { env, envBoolean, envNumber } from '~/global/env'

// 定义应用注册token
export const appRegToken = 'app'

// 使用环境变量配置全局前缀，默认为'api'
const globalPrefix = env('GLOBAL_PREFIX', 'api')

// 使用registerAs装饰器注册应用配置
export const AppConfig = registerAs(appRegToken, () => ({
  name: env('APP_NAME'), // 应用名称
  port: envNumber('APP_PORT', 3000), // 应用端口，使用默认值3000
  baseUrl: env('APP_BASE_URL'), // 应用基础URL
  globalPrefix, // 全局前缀
  locale: env('APP_LOCALE', 'zh-CN'), // 应用语言区域设置，默认为'zh-CN'
  /** 是否允许多端登录 */
  multiDeviceLogin: envBoolean('MULTI_DEVICE_LOGIN', true), // 是否允许多端登录，使用默认值true

  logger: {
    level: env('LOGGER_LEVEL'), // 日志级别
    maxFiles: envNumber('LOGGER_MAX_FILES'), // 最大日志文件数，使用默认值
  }, // 日志配置
}))

// 定义AppConfig的类型别名
export type IAppConfig = ConfigType<typeof AppConfig>

// 定义路由白名单，包含验证码和登录相关路径
export const RouterWhiteList: string[] = [
  `${globalPrefix ? '/' : ''}${globalPrefix}/auth/captcha/img`,
  `${globalPrefix ? '/' : ''}${globalPrefix}/auth/login`,
]
