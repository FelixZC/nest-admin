// 导入TypeORM相关模块
import {
  FindManyOptions,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm'

// 导入自定义模块
import { createPaginationObject } from './create-pagination'
import { IPaginationOptions, PaginationTypeEnum } from './interface'
import { Pagination } from './pagination'

// 定义默认分页限制和默认页码
const DEFAULT_LIMIT = 10
const DEFAULT_PAGE = 1

/**
 * 解析分页选项
 * @param options 分页选项
 * @returns 返回解析后的页码、每页数量和分页类型
 */
function resolveOptions(
  options: IPaginationOptions,
): [number, number, PaginationTypeEnum] {
  const { page, pageSize, paginationType } = options

  return [
    page || DEFAULT_PAGE,
    pageSize || DEFAULT_LIMIT,
    paginationType || PaginationTypeEnum.TAKE_AND_SKIP,
  ]
}

/**
 * 对Repository进行分页查询
 * @template T 实体类型
 * @param repository 实体仓库
 * @param options 分页选项
 * @param searchOptions 查询选项
 * @returns 返回分页结果的Promise
 */
async function paginateRepository<T>(
  repository: Repository<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>,
): Promise<Pagination<T>> {
  const [page, limit] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    repository.find({
      skip: limit * (page - 1),
      take: limit,
      ...searchOptions,
    }),
    repository.count(searchOptions),
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}

/**
 * 对QueryBuilder进行分页查询
 * @template T 实体类型
 * @param queryBuilder 查询构建器
 * @param options 分页选项
 * @returns 返回分页结果的Promise
 */
async function paginateQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)

  if (paginationType === PaginationTypeEnum.TAKE_AND_SKIP)
    queryBuilder.take(limit).skip((page - 1) * limit)
  else
    queryBuilder.limit(limit).offset((page - 1) * limit)

  const [items, total] = await queryBuilder.getManyAndCount()

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}

/**
 * 对原始查询进行分页
 * @template T 实体类型
 * @param queryBuilder 查询构建器
 * @param options 分页选项
 * @returns 返回分页结果的Promise
 */
export async function paginateRaw<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<Pagination<T>> {
  const [page, limit, paginationType] = resolveOptions(options)

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    (paginationType === PaginationTypeEnum.LIMIT_AND_OFFSET
      ? queryBuilder.limit(limit).offset((page - 1) * limit)
      : queryBuilder.take(limit).skip((page - 1) * limit)
    ).getRawMany<T>(),
    queryBuilder.getCount(),
  ]

  const [items, total] = await Promise.all(promises)

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  })
}

/**
 * 对原始查询和实体进行分页，同时返回原始数据和实体数据
 * @template T 实体类型
 * @param queryBuilder 查询构建器
 * @param options 分页选项
 * @returns 返回包含分页结果和原始数据的Promise
 */
export async function paginateRawAndEntities<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: IPaginationOptions,
): Promise<[Pagination<T>, Partial<T>[]]> {
  const [page, limit, paginationType] = resolveOptions(options)

  const promises: [
    Promise<{ entities: T[], raw: T[] }>,
    Promise<number> | undefined,
  ] = [
    (paginationType === PaginationTypeEnum.LIMIT_AND_OFFSET
      ? queryBuilder.limit(limit).offset((page - 1) * limit)
      : queryBuilder.take(limit).skip((page - 1) * limit)
    ).getRawAndEntities<T>(),
    queryBuilder.getCount(),
  ]

  const [itemObject, total] = await Promise.all(promises)

  return [
    createPaginationObject<T>({
      items: itemObject.entities,
      totalItems: total,
      currentPage: page,
      limit,
    }),
    itemObject.raw,
  ]
}

/**
 * 分页函数，支持Repository和QueryBuilder
 * @template T 实体类型
 * @param repositoryOrQueryBuilder 实体仓库或查询构建器
 * @param options 分页选项
 * @param searchOptions 查询选项
 * @returns 返回分页结果的Promise
 */
export async function paginate<T extends ObjectLiteral>(
  repositoryOrQueryBuilder: Repository<T> | SelectQueryBuilder<T>,
  options: IPaginationOptions,
  searchOptions?: FindOptionsWhere<T> | FindManyOptions<T>,
) {
  return repositoryOrQueryBuilder instanceof Repository
    ? paginateRepository<T>(repositoryOrQueryBuilder, options, searchOptions)
    : paginateQueryBuilder<T>(repositoryOrQueryBuilder, options)
}
