// 导入node的cluster模块，用于群集管理
import cluster from 'node:cluster'

// 判断是否为主群集，即NODE_APP_INSTANCE环境变量是否为0
export const isMainCluster
  = process.env.NODE_APP_INSTANCE && Number.parseInt(process.env.NODE_APP_INSTANCE) === 0
// 判断是否为主进程，如果不是群集模式或者本身就是主群集
export const isMainProcess = cluster.isPrimary || isMainCluster

// 判断是否为开发环境
export const isDev = process.env.NODE_ENV === 'development'

// 判断是否为测试环境
export const isTest = !!process.env.TEST
// 获取当前工作目录
export const cwd = process.cwd()

/**
 * 基础类型接口
 */
export type BaseType = boolean | number | string | undefined | null

/**
 * 格式化环境变量
 * @param key 环境变量的键值
 * @param defaultValue 默认值
 * @param callback 格式化函数
 */
function formatValue<T extends BaseType = string>(key: string, defaultValue: T, callback?: (value: string) => T): T {
  const value: string | undefined = process.env[key]
  if (typeof value === 'undefined')
    return defaultValue

  if (!callback)
    return value as unknown as T

  return callback(value)
}

// 获取环境变量的原始值，如果没有则返回默认值
export function env(key: string, defaultValue: string = '') {
  return formatValue(key, defaultValue)
}

// 获取环境变量的字符串值，如果没有则返回默认值
export function envString(key: string, defaultValue: string = '') {
  return formatValue(key, defaultValue)
}

// 获取环境变量的数字值，如果没有则返回默认值
export function envNumber(key: string, defaultValue: number = 0) {
  return formatValue(key, defaultValue, (value) => {
    try {
      return Number(value)
    }
    catch {
      throw new Error(`${key} environment variable is not a number`)
    }
  })
}

// 获取环境变量的布尔值，如果没有则返回默认值
export function envBoolean(key: string, defaultValue: boolean = false) {
  return formatValue(key, defaultValue, (value) => {
    try {
      return Boolean(JSON.parse(value))
    }
    catch {
      throw new Error(`${key} environment variable is not a boolean`)
    }
  })
}
