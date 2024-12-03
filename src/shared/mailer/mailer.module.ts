// 导入node:path模块以使用join函数，用于路径拼接
import { join } from 'node:path'

// 导入NestJS的Module和Provider类型，用于创建模块和提供者
import { Module, Provider } from '@nestjs/common'
// 导入ConfigModule和ConfigService用于配置管理
import { ConfigModule, ConfigService } from '@nestjs/config'
// 导入NestMailerModule用于集成邮件发送功能
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer'
// 导入HandlebarsAdapter作为邮件模板引擎
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'

// 导入配置相关的类型定义
import { ConfigKeyPaths, IAppConfig, IMailerConfig } from '~/config'

// 导入MailerService提供邮件发送服务
import { MailerService } from './mailer.service'

// 定义提供者数组，包含MailerService
const providers: Provider<any>[] = [
  MailerService,
]

// 使用@Module装饰器定义MailerModule模块
@Module({
  imports: [
    // 配置NestMailerModule
    NestMailerModule.forRootAsync({
      imports: [ConfigModule], // 引入ConfigModule以访问配置服务
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => ({
        // 配置邮件发送的传输层
        transport: configService.get<IMailerConfig>('mailer'),
        defaults: {
          // 配置默认的发件人信息
          from: {
            name: configService.get<IAppConfig>('app').name,
            address: configService.get<IMailerConfig>('mailer').auth.user,
          },
        },
        template: {
          // 指定邮件模板的目录
          dir: join(__dirname, '..', '..', '/assets/templates'),
          // 使用Handlebars作为模板引擎
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true, // 严格模式解析模板
          },
        },
      }),
      inject: [ConfigService], // 注入ConfigService
    }),
  ],
  providers, // 注册提供者
  exports: providers, // 导出提供者
})
// 定义并导出MailerModule模块
export class MailerModule {}
