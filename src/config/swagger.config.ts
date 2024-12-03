import { ConfigType, registerAs } from '@nestjs/config'

import { env, envBoolean } from '~/global/env'

// 定义一个用于注册Swagger配置的token常量
export const swaggerRegToken = 'swagger'

// 使用registerAs函数来动态注册Swagger的配置
// 这个函数返回一个函数，用于在应用程序启动时设置Swagger的相关配置
export const SwaggerConfig = registerAs(swaggerRegToken, () => ({
  enable: envBoolean('SWAGGER_ENABLE'),
  path: env('SWAGGER_PATH'),
}))

// 定义一个类型，用于描述Swagger配置的接口结构
export type ISwaggerConfig = ConfigType<typeof SwaggerConfig>
