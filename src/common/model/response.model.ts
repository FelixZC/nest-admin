import { ApiProperty } from '@nestjs/swagger'

import {
  RESPONSE_SUCCESS_CODE,
  RESPONSE_SUCCESS_MSG,
} from '~/constants/response.constant'

/**
 * 泛型类 ResOp 用于创建带分页信息的响应对象
 * @template T - 响应数据的类型，默认为 any
 */
export class ResOp<T = any> {
  @ApiProperty({ type: 'object' })
  data?: T

  @ApiProperty({ type: 'number', default: RESPONSE_SUCCESS_CODE })
  code: number

  @ApiProperty({ type: 'string', default: RESPONSE_SUCCESS_MSG })
  message: string

  /**
   * 构造函数
   * @param code 响应码
   * @param data 响应数据
   * @param message 响应消息，默认为成功消息
   */
  constructor(code: number, data: T, message = RESPONSE_SUCCESS_MSG) {
    this.code = code
    this.data = data
    this.message = message
  }

  /**
   * 创建一个成功的响应对象
   * @param data 响应数据，默认为 undefined
   * @param message 响应消息，默认为成功消息
   * @returns 成功的响应对象
   */
  static success<T>(data?: T, message?: string) {
    return new ResOp(RESPONSE_SUCCESS_CODE, data, message)
  }

  /**
   * 创建一个错误的响应对象
   * @param code 错误码
   * @param message 错误消息
   * @returns 错误的响应对象
   */
  static error(code: number, message) {
    return new ResOp(code, {}, message)
  }
}

/**
 * 泛型类 TreeResult 用于表示树形结构的结果
 * @template T - 子结果的类型
 */
export class TreeResult<T> {
  @ApiProperty()
  id: number

  @ApiProperty()
  parentId: number

  @ApiProperty()
  children?: TreeResult<T>[]
}
