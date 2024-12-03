import cluster from 'node:cluster'
import { Cron } from '@nestjs/schedule'
import { isMainProcess } from '~/global/env'

/**
 * 类似于 Cron 的装饰器，但在特定的进程环境中只执行一次。
 * 在非集群模式下或 PM2 主进程中执行，或在集群模式下的第一个工作进程中执行。
 * 这是为了确保在多进程环境中定时任务只执行一次。
 *
 * @param {...any} rest - 装饰器参数
 * @returns {MethodDecorator} - 返回一个方法装饰器
 */
export const CronOnce: typeof Cron = (...rest): MethodDecorator => {
  // 如果不在集群模式下，并且是 PM2 主进程
  if (isMainProcess) {
    return Cron(...rest)
  }

  // 如果在集群模式下，并且是第一个工作进程
  if (cluster.isWorker && cluster.worker?.id === 1) {
    return Cron(...rest)
  }

  // 其他情况下，返回一个空的装饰器，不执行任何操作
  return () => {}
}
