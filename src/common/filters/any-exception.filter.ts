import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { QueryFailedError } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'

import { isDev } from '~/global/env'

// 定义一个错误接口，用于处理异常时的错误信息
interface myError {
  readonly status: number
  readonly statusCode?: number

  readonly message?: string
}

// 捕获所有异常的过滤器
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  constructor() {
    // 注册全局异常处理钩子
    this.registerCatchAllExceptionsHook()
  }

  // 处理异常的核心方法
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const response = ctx.getResponse<FastifyReply>()

    const url = request.raw.url!

    const status = this.getStatus(exception)
    let message = this.getErrorMessage(exception)

    // 当异常为系统内部错误且不是业务异常时
    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR
      && !(exception instanceof BusinessException)
    ) {
      Logger.error(exception, undefined, 'Catch')

      // 在生产环境下隐藏错误信息
      if (!isDev)
        message = ErrorEnum.SERVER_ERROR?.split(':')[1]
    }
    else {
      // 记录警告日志
      this.logger.warn(
        `错误信息：(${status}) ${message} Path: ${decodeURI(url)}`,
      )
    }

    // 根据异常类型确定错误码
    const apiErrorCode = exception instanceof BusinessException ? exception.getErrorCode() : status

    // 构造基础响应体
    const resBody: IBaseResponse = {
      code: apiErrorCode,
      message,
      data: null,
    }

    // 发送异常响应
    response.status(status).send(resBody)
  }

  // 获取异常状态码的方法
  getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus()
    }
    else if (exception instanceof QueryFailedError) {
      // 数据库查询失败错误，统一视为内部服务器错误
      return HttpStatus.INTERNAL_SERVER_ERROR
    }
    else {
      // 其他类型的异常，尝试获取其状态码或状态代码
      return (exception as myError)?.status
        ?? (exception as myError)?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR
    }
  }

  // 获取异常错误信息的方法
  getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.message
    }
    else if (exception instanceof QueryFailedError) {
      return exception.message
    }
    else {
      // 对于其他异常，尝试获取其错误信息
      return (exception as any)?.response?.message ?? (exception as myError)?.message ?? `${exception}`
    }
  }

  // 注册全局异常处理钩子的方法
  registerCatchAllExceptionsHook() {
    // 监听未捕获的Promise异常
    process.on('unhandledRejection', (reason) => {
      console.error('unhandledRejection: ', reason)
    })

    // 监听未捕获的异常
    process.on('uncaughtException', (err) => {
      console.error('uncaughtException: ', err)
    })
  }
}
