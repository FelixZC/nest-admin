import { Logger } from '@nestjs/common'
import { Logger as ITypeORMLogger, LoggerOptions, QueryRunner } from 'typeorm'

/**
 * 实现 TypeORM 日志记录接口，统一日志记录标准q
 */
export class TypeORMLogger implements ITypeORMLogger {
  private logger = new Logger(TypeORMLogger.name)

  /**
   * 构造函数
   * @param options 日志记录选项
   */
  constructor(private options: LoggerOptions) {}

  /**
   * 记录 SQL 查询
   * @param query SQL 查询语句
   * @param parameters 查询参数
   * @param _queryRunner 查询执行器
   */
  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    if (!this.isEnable('query'))
      return

    const sql
      = query
      + (parameters && parameters.length
        ? ` -- PARAMETERS: ${this.stringifyParams(parameters)}`
        : '')

    this.logger.log(`[QUERY]: ${sql}`)
  }

  /**
   * 记录 SQL 查询错误
   * @param error 错误信息
   * @param query SQL 查询语句
   * @param parameters 查询参数
   * @param _queryRunner 查询执行器
   */
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    if (!this.isEnable('error'))
      return

    const sql
      = query
      + (parameters && parameters.length
        ? ` -- PARAMETERS: ${this.stringifyParams(parameters)}`
        : '')

    this.logger.error([`[FAILED QUERY]: ${sql}`, `[QUERY ERROR]: ${error}`])
  }

  /**
   * 记录慢查询
   * @param time 查询执行时间
   * @param query SQL 查询语句
   * @param parameters 查询参数
   * @param _queryRunner 查询执行器
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    const sql
      = query
      + (parameters && parameters.length
        ? ` -- PARAMETERS: ${this.stringifyParams(parameters)}`
        : '')

    this.logger.warn(`[SLOW QUERY: ${time} ms]: ${sql}`)
  }

  /**
   * 记录模式构建日志
   * @param message 日志信息
   * @param _queryRunner 查询执行器
   */
  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    if (!this.isEnable('schema'))
      return

    this.logger.log(message)
  }

  /**
   * 记录迁移日志
   * @param message 日志信息
   * @param _queryRunner 查询执行器
   */
  logMigration(message: string, _queryRunner?: QueryRunner) {
    if (!this.isEnable('migration'))
      return

    this.logger.log(message)
  }

  /**
   * 通用日志记录方法
   * @param level 日志级别
   * @param message 日志信息
   * @param _queryRunner 查询执行器
   */
  log(
    level: 'warn' | 'info' | 'log',
    message: any,
    _queryRunner?: QueryRunner,
  ) {
    if (!this.isEnable(level))
      return

    switch (level) {
      case 'log':
        this.logger.debug(message)
        break
      case 'info':
        this.logger.log(message)
        break
      case 'warn':
        this.logger.warn(message)
        break
      default:
        break
    }
  }

  /**
   * 将参数转换为字符串
   * 有时参数可能包含循环对象，因此需要处理这种情况
   * @param parameters 参数数组
   * @returns 转换后的字符串
   */
  private stringifyParams(parameters: any[]) {
    try {
      return JSON.stringify(parameters)
    }
    catch (error) {
      // 可能是参数中包含循环对象
      return parameters
    }
  }

  /**
   * 检查是否启用某一级别的日志记录
   * @param level 日志级别
   * @returns 是否启用
   */
  private isEnable(
    level: 'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration',
  ): boolean {
    return (
      this.options === 'all'
      || this.options === true
      || (Array.isArray(this.options) && this.options.includes(level))
    )
  }
}
