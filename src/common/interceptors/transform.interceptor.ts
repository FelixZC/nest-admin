import type { FastifyRequest } from 'fastify'
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import qs from 'qs'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { ResOp } from '~/common/model/response.model'

import { BYPASS_KEY } from '../decorators/bypass.decorator'

/**
 * 统一处理接口请求与响应结果，如果不需要则添加 @Bypass 装饰器
 *
 * 此拦截器主要用于处理所有的请求和响应，提供统一的处理方式，包括状态码和数据封装
 * 通过检查方法上是否使用了 @Bypass 装饰器来决定是否跳过处理
 *
 * @implements {NestInterceptor} 实现 NestJS 的拦截器接口
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 拦截器的主要逻辑
   *
   * @param {ExecutionContext} context 当前执行上下文，可用于获取请求和响应对象
   * @param {CallHandler<any>} next 下一个处理函数，用于执行请求的下一个中间件或路由处理器
   * @returns {Observable<any>} 返回一个可观察对象，用于处理请求的响应
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    // 检查路由处理器上是否有 @Bypass 装饰器，如果有则跳过处理
    const bypass = this.reflector.get<boolean>(
      BYPASS_KEY,
      context.getHandler(),
    )

    if (bypass)
      return next.handle()

    const http = context.switchToHttp()
    const request = http.getRequest<FastifyRequest>()

    // 处理 query 参数，将数组参数转换为数组,如：?a[]=1&a[]=2 => { a: [1, 2] }
    request.query = qs.parse(request.url.split('?').at(1))

    // 处理响应结果，将其封装为统一的响应格式
    return next.handle().pipe(
      map((data) => {
        // 如果数据为 undefined，则设置状态码为 NO_CONTENT 并返回数据
        // if (typeof data === 'undefined') {
        //   context.switchToHttp().getResponse().status(HttpStatus.NO_CONTENT);
        //   return data;
        // }

        // 将数据封装为 ResOp 对象，状态码为 OK，数据为实际返回数据
        return new ResOp(HttpStatus.OK, data ?? null)
      }),
    )
  }
}
