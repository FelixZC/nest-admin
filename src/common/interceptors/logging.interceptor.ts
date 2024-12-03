import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'

/**
 * 日志拦截器类，用于记录请求和响应的日志
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // 创建一个日志记录器实例，用于记录日志，且不带时间戳
  private logger = new Logger(LoggingInterceptor.name, { timestamp: false })

  /**
   * 拦截器的主要逻辑方法
   * @param context 上下文对象，包含请求和响应等信息
   * @param next 用于执行下一个拦截器或最终执行的处理器
   * @returns 返回一个Observable对象，代表异步操作
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    // 调用下一个拦截器或处理器，返回一个Observable对象
    const call$ = next.handle()
    // 从上下文中获取HTTP请求对象
    const request = context.switchToHttp().getRequest()
    // 构造请求内容的字符串表示
    const content = `${request.method} -> ${request.url}`
    // 判断是否为Server-Sent Events(SSE)请求
    const isSse = request.headers.accept === 'text/event-stream'
    // 记录请求日志
    this.logger.debug(`+++ 请求：${content}`)
    // 记录请求开始的时间
    const now = Date.now()

    // 使用tap操作符在响应流上添加副作用，主要用于日志记录
    return call$.pipe(
      tap(() => {
        // 如果是SSE请求，则不记录响应日志
        if (isSse)
          return

        // 记录响应日志，包括处理时间
        this.logger.debug(`--- 响应：${content}${' +'}${Date.now() - now}ms`)
      },
      ),
    )
  }
}
