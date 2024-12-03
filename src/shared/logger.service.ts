import type { Logger as WinstonLogger } from 'winston'

import { ConsoleLogger, ConsoleLoggerOptions, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { config, createLogger, format, transports } from 'winston'

import { ConfigKeyPaths } from '~/config'

import 'winston-daily-rotate-file'

/**
 * 定义日志级别枚举
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * 日志服务类，继承自Nest的ConsoleLogger
 * 使用Winston作为日志记录器，支持每日日志文件旋转和错误日志单独记录
 */
@Injectable()
export class LoggerService extends ConsoleLogger {
  private winstonLogger: WinstonLogger

  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    private configService: ConfigService<ConfigKeyPaths>,
  ) {
    super(context, options)
    this.initWinston()
  }

  /**
   * 获取日志级别
   */
  protected get level(): LogLevel {
    return this.configService.get('app.logger.level', { infer: true }) as LogLevel
  }

  /**
   * 获取最大日志文件数量
   */
  protected get maxFiles(): number {
    return this.configService.get('app.logger.maxFiles', { infer: true })
  }

  /**
   * 初始化Winston日志记录器
   */
  protected initWinston(): void {
    this.winstonLogger = createLogger({
      levels: config.npm.levels,
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.json(),
      ),
      transports: [
        new transports.DailyRotateFile({
          level: this.level,
          filename: 'logs/app.%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.maxFiles,
          format: format.combine(format.timestamp(), format.json()),
          auditFile: 'logs/.audit/app.json',
        }),
        new transports.DailyRotateFile({
          level: LogLevel.ERROR,
          filename: 'logs/app-error.%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: this.maxFiles,
          format: format.combine(format.timestamp(), format.json()),
          auditFile: 'logs/.audit/app-error.json',
        }),
      ],
    })

    // if (isDev) {
    //   this.winstonLogger.add(
    //     new transports.Console({
    //       level: this.level,
    //       format: format.combine(
    //         format.simple(),
    //         format.colorize({ all: true }),
    //       ),
    //     }),
    //   );
    // }
  }

  /**
   * 记录详细信息级别的日志
   * @param message 日志信息
   * @param context 日志上下文
   */
  verbose(message: any, context?: string): void {
    super.verbose.apply(this, [message, context])

    this.winstonLogger.log(LogLevel.VERBOSE, message, { context })
  }

  /**
   * 记录调试级别的日志
   * @param message 日志信息
   * @param context 日志上下文
   */
  debug(message: any, context?: string): void {
    super.debug.apply(this, [message, context])

    this.winstonLogger.log(LogLevel.DEBUG, message, { context })
  }

  /**
   * 记录信息级别的日志
   * @param message 日志信息
   * @param context 日志上下文
   */
  log(message: any, context?: string): void {
    super.log.apply(this, [message, context])

    this.winstonLogger.log(LogLevel.INFO, message, { context })
  }

  /**
   * 记录警告级别的日志
   * @param message 日志信息
   * @param context 日志上下文
   */
  warn(message: any, context?: string): void {
    super.warn.apply(this, [message, context])

    this.winstonLogger.log(LogLevel.WARN, message)
  }

  /**
   * 记录错误级别的日志
   * @param message 日志信息
   * @param stack 错误堆栈
   * @param context 日志上下文
   */
  error(message: any, stack?: string, context?: string): void {
    super.error.apply(this, [message, stack, context])

    const hasStack = !!context
    this.winstonLogger.log(LogLevel.ERROR, {
      context: hasStack ? context : stack,
      message: hasStack ? new Error(message) : message,
    })
  }
}
