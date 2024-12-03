import { HttpException, HttpStatus } from '@nestjs/common'

import { ErrorEnum } from '~/constants/error-code.constant'
import { RESPONSE_SUCCESS_CODE } from '~/constants/response.constant'

/**
 * 业务异常类，继承自 HttpException
 * 用于处理业务逻辑中的异常情况，可以根据错误码或者自定义错误信息进行初始化
 */
export class BusinessException extends HttpException {
  private errorCode: number

  /**
   * 构造函数，根据传入的错误信息初始化 BusinessException
   * @param error 错误信息，可以是 ErrorEnum 枚举中的一个错误码，或者自定义的字符串错误信息
   */
  constructor(error: ErrorEnum | string) {
    // 如果是非 ErrorEnum
    if (!error.includes(':')) {
      super(
        HttpException.createBody({
          code: RESPONSE_SUCCESS_CODE,
          message: error,
        }),
        HttpStatus.OK,
      )
      this.errorCode = RESPONSE_SUCCESS_CODE
      return
    }

    const [code, message] = error.split(':')
    super(
      HttpException.createBody({
        code,
        message,
      }),
      HttpStatus.OK,
    )

    this.errorCode = Number(code)
  }

  /**
   * 获取错误码
   * @returns 返回错误码
   */
  getErrorCode(): number {
    return this.errorCode
  }
}

// 导出 BusinessException 为 BizException
export { BusinessException as BizException }
