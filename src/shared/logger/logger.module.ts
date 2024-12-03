// 导入Module装饰器
import { Module } from '@nestjs/common'

// 导入日志服务
import { LoggerService } from '../logger.service'

// 定义LoggerModule模块
@Module({})
export class LoggerModule {
  /**
   * 创建并配置一个日志模块
   * 此方法用于配置和创建一个全局可用的日志模块它返回一个模块配置对象，
   * 其中包括模块的全局性声明、模块自身、提供的服务以及导出的服务
   *
   * @returns 返回模块配置对象
   */
  static forRoot() {
    return {
      global: true, // 声明此模块为全局可用
      module: LoggerModule, // 指定模块自身
      providers: [LoggerService], // 定义模块提供的服务
      exports: [LoggerService], // 定义模块导出的服务
    }
  }
}
