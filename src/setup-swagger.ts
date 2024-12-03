import { INestApplication, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { API_SECURITY_AUTH } from './common/decorators/swagger.decorator'
import { CommonEntity } from './common/entity/common.entity'
import { ResOp, TreeResult } from './common/model/response.model'
import { ConfigKeyPaths, IAppConfig, ISwaggerConfig } from './config'
import { Pagination } from './helper/paginate/pagination'

/**
 * 设置Swagger文档
 * @param app Nest应用程序实例
 * @param configService 配置服务，用于获取应用和Swagger的配置
 */
export function setupSwagger(
  app: INestApplication,
  configService: ConfigService<ConfigKeyPaths>,
): void {
  // 获取应用配置
  const { name, port } = configService.get<IAppConfig>('app')!
  // 获取Swagger配置
  const { enable, path } = configService.get<ISwaggerConfig>('swagger')!

  // 如果Swagger未启用，则不执行后续操作
  if (!enable)
    return

  // 构建Swagger文档配置
  const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name} API文档`)
    .setVersion('1.0')

  // 添加认证安全设置
  documentBuilder.addSecurity(API_SECURITY_AUTH, {
    description: '输入令牌',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  })

  // 创建Swagger文档
  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: false,
    extraModels: [CommonEntity, ResOp, Pagination, TreeResult],
  })

  // 设置并注册Swagger模块
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持登录状态
    },
  })

  // 日志记录Swagger文档服务启动信息
  const logger = new Logger('SwaggerModule')
  logger.log(`文档运行于 http://127.0.0.1:${port}/${path}`)
}
