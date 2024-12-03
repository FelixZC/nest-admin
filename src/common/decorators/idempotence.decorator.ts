import { SetMetadata } from '@nestjs/common'

import { IdempotenceOption } from '../interceptors/idempotence.interceptor'

export const HTTP_IDEMPOTENCE_KEY = Symbol('__idempotence_key__')
export const HTTP_IDEMPOTENCE_OPTIONS = Symbol('__idempotence_options__')

/**
 * 幂等装饰器
 * 用于在NestJS中标记一个方法为幂等方法，配合拦截器使用，以实现幂等操作
 * @param options 可选的幂等配置选项
 * @returns 返回一个方法装饰器
 */
export function Idempotence(options?: IdempotenceOption): MethodDecorator {
  // 返回一个方法装饰器函数
  return function (target, key, descriptor: PropertyDescriptor) {
    // 使用SetMetadata将配置选项应用到方法的元数据中
    SetMetadata(HTTP_IDEMPOTENCE_OPTIONS, options || {})(descriptor.value)
  }
}
