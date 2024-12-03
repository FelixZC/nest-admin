import type { Type } from '@nestjs/common'

import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiBody, IntersectionType, PartialType } from '@nestjs/swagger'
import { upperFirst } from 'lodash'
import pluralize from 'pluralize'

import { ApiResult } from '~/common/decorators/api-result.decorator'
import { IdParam } from '~/common/decorators/id-param.decorator'
import { PagerDto } from '~/common/dto/pager.dto'

import { BaseService } from './base.service'

/**
 * 生成一个基础的CRUD控制器工厂函数
 *
 * @param entity 实体类，用于数据库操作
 * @param dto 数据传输对象类，用于控制器和外部交互，默认为实体类
 * @param permissions 权限配置，用于控制不同操作的权限，默认为自动生成的权限
 * @returns 返回一个控制器类，用于处理CRUD操作
 */
export function BaseCrudFactory<
  E extends new (...args: any[]) => any,
>({ entity, dto, permissions }: { entity: E, dto?: Type<any>, permissions?: Record<string, string> }): Type<any> {
  // 通过实体类名生成控制器的路由前缀
  const prefix = entity.name.toLowerCase().replace(/entity$/, '')
  const pluralizeName = pluralize(prefix) as string

  // 如果未提供DTO类，则使用实体类作为基础生成DTO类
  dto = dto ?? class extends entity {}

  // 定义DTO类，用于数据传输
  class Dto extends dto {
    static readonly name = upperFirst(`${pluralizeName}Dto`)
  }
  // 定义更新用的DTO类，允许部分更新
  class UpdateDto extends PartialType(Dto) {
    static readonly name = upperFirst(`${pluralizeName}UpdateDto`)
  }
  // 定义查询用的DTO类，包含分页和过滤条件
  class QueryDto extends IntersectionType(PagerDto, PartialType(Dto)) {
    static readonly name = upperFirst(`${pluralizeName}QueryDto`)
  }

  // 定义或生成权限配置
  permissions = permissions ?? {
    LIST: `${prefix}:list`,
    CREATE: `${prefix}:create`,
    READ: `${prefix}:read`,
    UPDATE: `${prefix}:update`,
    DELETE: `${prefix}:delete`,
  } as const

  // 定义控制器类，处理CRUD操作
  @Controller(pluralizeName)
  class BaseController<S extends BaseService<E>> {
    constructor(private service: S) { }

    // 处理列表查询请求
    @Get()
    @ApiResult({ type: [entity], isPage: true })
    async list(@Query() pager: QueryDto) {
      return await this.service.list(pager)
    }

    // 处理单个实体查询请求
    @Get(':id')
    @ApiResult({ type: entity })
    async get(@IdParam() id: number) {
      return await this.service.findOne(id)
    }

    // 处理创建实体请求
    @Post()
    @ApiBody({ type: dto })
    async create(@Body() dto: Dto) {
      return await this.service.create(dto)
    }

    // 处理更新实体请求
    @Put(':id')
    async update(@IdParam() id: number, @Body() dto: UpdateDto) {
      return await this.service.update(id, dto)
    }

    // 处理部分更新实体请求
    @Patch(':id')
    async patch(@IdParam() id: number, @Body() dto: UpdateDto) {
      await this.service.update(id, dto)
    }

    // 处理删除实体请求
    @Delete(':id')
    async delete(@IdParam() id: number) {
      await this.service.delete(id)
    }
  }

  return BaseController
}
