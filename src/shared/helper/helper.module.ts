// 导入NestJS框架的必要模块和类型
import { Global, Module, type Provider } from '@nestjs/common'

// 导入本模块所需的的服务
import { CronService } from './cron.service'
import { QQService } from './qq.service'

// 定义服务提供者数组
const providers: Provider[] = [
  CronService,
  QQService,
]

// 定义全局模块
@Global()
@Module({
  imports: [],
  providers,
  exports: providers,
})
// HelperModule是一个全局模块，包含了一组工具服务
export class HelperModule {}
