// 导入Http异常类
import { HttpException } from '@nestjs/common'
// 导入WebSocket异常类
import { WsException } from '@nestjs/websockets'

// 导入错误码常量
import { ErrorEnum } from '~/constants/error-code.constant'

/**
 * 自定义Socket异常类，继承自WsException
 * 用于处理WebSocket连接中的异常情况
 */
export class SocketException extends WsException {
  // 私有属性，用于存储错误码
  private errorCode: number

  /**
   * 构造函数重载，可以接受字符串或ErrorEnum类型的错误信息
   * @param message 错误信息字符串
   * @param error 错误码枚举
   */
  constructor(message: string)
  constructor(error: ErrorEnum)
  // 构造函数实现，支持多种参数类型
  constructor(...args: any) {
    // 解析参数，优先考虑ErrorEnum类型
    const error = args[0]
    if (typeof error === 'string') {
      // 当传入的是字符串时，创建一个通用的Http异常体
      super(
        HttpException.createBody({
          code: 0,
          message: error,
        }),
      )
      this.errorCode = 0
      return
    }

    // 当传入的是ErrorEnum时，解析错误码和错误信息
    const [code, message] = error.split(':')
    // 创建具有特定错误码的Http异常体
    super(
      HttpException.createBody({
        code,
        message,
      }),
    )

    // 存储错误码
    this.errorCode = Number(code)
  }

  /**
   * 获取错误码
   * @returns 错误码数字
   */
  getErrorCode(): number {
    return this.errorCode
  }
}
