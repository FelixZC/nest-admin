import { ObjectLiteral } from 'typeorm'

// 分页类型枚举，定义了两种分页查询方式：LIMIT_AND_OFFSET 和 TAKE_AND_SKIP
export enum PaginationTypeEnum {
  LIMIT_AND_OFFSET = 'limit',
  TAKE_AND_SKIP = 'take',
}

// 分页选项接口，包含了分页查询所需的页码（page）和每页数量（pageSize），以及可选的分页类型（paginationType）
export interface IPaginationOptions {
  page: number
  pageSize: number
  paginationType?: PaginationTypeEnum
}

// 分页元数据接口，包含了分页查询返回的数据项数量（itemCount）、总数据量（totalItems，可选）、
// 每页数据量（itemsPerPage）、总页数（totalPages，可选）以及当前页码（currentPage）
export interface IPaginationMeta extends ObjectLiteral {
  itemCount: number
  totalItems?: number
  itemsPerPage: number
  totalPages?: number
  currentPage: number
}

// 分页链接接口，包含了指向分页数据的各个页面的链接：首页（first）、上一页（previous）、
// 下一页（next）和末页（last），这些链接是可选的
export interface IPaginationLinks {
  first?: string
  previous?: string
  next?: string
  last?: string
}
