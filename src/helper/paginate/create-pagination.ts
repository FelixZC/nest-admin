import { IPaginationMeta } from './interface'
import { Pagination } from './pagination'

/**
 * 创建分页对象
 *
 * 此函数用于生成一个分页对象，其中包括当前页的数据项以及分页的元信息
 * 如总数据量，当前页数，每页数据量，总页数等
 *
 * @param items 当前页的数据项数组
 * @param totalItems 所有数据的总数，如果未提供，则不计算总页数
 * @param currentPage 当前显示的页码
 * @param limit 每页显示的数据条数
 * @returns 返回一个分页对象，包含当前页数据和分页元信息
 */
export function createPaginationObject<T>({
  items,
  totalItems,
  currentPage,
  limit,
}: {
  items: T[]
  totalItems?: number
  currentPage: number
  limit: number
}): Pagination<T> {
  // 计算总页数，如果提供了总数据量的话
  const totalPages
    = totalItems !== undefined ? Math.ceil(totalItems / limit) : undefined

  // 构建分页元信息对象
  const meta: IPaginationMeta = {
    totalItems,
    itemCount: items.length,
    itemsPerPage: limit,
    totalPages,
    currentPage,
  }

  // 返回一个新的分页对象，包含当前页数据和分页元信息
  return new Pagination<T>(items, meta)
}
