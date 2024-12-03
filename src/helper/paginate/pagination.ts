// 导入ObjectLiteral类型，它是TypeORM中的一个通用类型
import { ObjectLiteral } from 'typeorm'

// 导入IPaginationMeta接口，该接口定义了分页元数据的结构
import { IPaginationMeta } from './interface'

/**
 * Pagination类用于封装分页数据
 * 它提供了两个泛型参数：PaginationObject表示分页列表中的项类型
 * T是一个泛型，它扩展了IPaginationMeta接口，允许用户提供自定义的分页元数据类型
 */
export class Pagination<
  PaginationObject,
  T extends ObjectLiteral = IPaginationMeta,
> {
  /**
   * 构造函数用于创建Pagination对象
   * @param items 分页列表中的项数组，类型为PaginationObject[]
   * @param meta 分页的元数据，包含了如总页数、当前页码等信息，类型为T
   */
  constructor(
    public readonly items: PaginationObject[],

    public readonly meta: T,
  ) {}
}
