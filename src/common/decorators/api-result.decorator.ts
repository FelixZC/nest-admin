import { applyDecorators, HttpStatus, RequestMethod, Type } from '@nestjs/common'
import { METHOD_METADATA } from '@nestjs/common/constants'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

import { ResOp } from '~/common/model/response.model'

// 定义基础类型名称，用于后续判断是否为基础类型
const baseTypeNames = ['String', 'Number', 'Boolean']

/**
 * 生成基础属性对象
 * @param type 要生成属性的类型
 * @returns 返回属性对象
 */
function genBaseProp(type: Type<any>) {
  if (baseTypeNames.includes(type.name))
    return { type: type.name.toLocaleLowerCase() }
  else
    return { $ref: getSchemaPath(type) }
}

/**
 * 生成返回结果装饰器
 * 用于装饰控制器方法，以定义其返回值的结构
 * @param type 返回值类型，可以是单个类型或类型数组
 * @param isPage 是否分页
 * @param status HTTP状态码
 * @returns 返回装饰器
 */
export function ApiResult<TModel extends Type<any>>({
  type,
  isPage,
  status,
}: {
  type?: TModel | TModel[]
  isPage?: boolean
  status?: HttpStatus
}) {
  let prop = null

  // 根据类型和是否分页生成相应的属性对象
  if (Array.isArray(type)) {
    if (isPage) {
      prop = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: getSchemaPath(type[0]) },
          },
          meta: {
            type: 'object',
            properties: {
              itemCount: { type: 'number', default: 0 },
              totalItems: { type: 'number', default: 0 },
              itemsPerPage: { type: 'number', default: 0 },
              totalPages: { type: 'number', default: 0 },
              currentPage: { type: 'number', default: 0 },
            },
          },
        },
      }
    }
    else {
      prop = {
        type: 'array',
        items: genBaseProp(type[0]),
      }
    }
  }
  else if (type) {
    prop = genBaseProp(type)
  }
  else {
    prop = { type: 'null', default: null }
  }

  // 确定模型类型，用于后续的ApiExtraModels装饰器
  const model = Array.isArray(type) ? type[0] : type

  // 返回一个装饰器，用于装饰控制器方法
  return applyDecorators(
    ApiExtraModels(model),
    (
      target: object,
      key: string | symbol,
      descriptor: TypedPropertyDescriptor<any>,
    ) => {
      queueMicrotask(() => {
        // 检查是否为POST方法，以决定默认的HTTP状态码
        const isPost = Reflect.getMetadata(METHOD_METADATA, descriptor.value) === RequestMethod.POST

        // 使用ApiResponse装饰器定义返回值的结构
        ApiResponse({
          status: status ?? (isPost ? HttpStatus.CREATED : HttpStatus.OK),
          schema: {
            allOf: [
              { $ref: getSchemaPath(ResOp) },
              {
                properties: {
                  data: prop,
                },
              },
            ],
          },
        })(target, key, descriptor)
      })
    },
  )
}
