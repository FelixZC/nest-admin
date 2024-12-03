// 定义一个延时函数，用于暂停执行
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 定义一个调度微任务的函数，用于在微任务中执行回调
 * @param callback 待执行的回调函数
 */
export function scheduleMicrotask(callback: () => void) {
  sleep(0).then(callback)
}

// 定义通知回调类型的别名
type NotifyCallback = () => void

// 定义接受通知回调函数类型的别名
type NotifyFunction = (callback: () => void) => void

// 定义接受批量通知回调函数类型的别名
type BatchNotifyFunction = (callback: () => void) => void

/**
 * 创建一个通知管理器，用于管理和调度通知
 */
export function createNotifyManager() {
  // 定义一个队列，用于存储待执行的通知回调
  let queue: NotifyCallback[] = []
  // 定义一个事务计数器，用于跟踪当前是否在事务中
  let transactions = 0
  // 定义一个通知函数，用于执行通知回调
  let notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  // 定义一个批量通知函数，用于批量执行通知回调
  let batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
    callback()
  }

  /**
   * 刷新队列，执行所有待处理的通知回调
   */
  const flush = (): void => {
    const originalQueue = queue
    queue = []
    if (originalQueue.length) {
      scheduleMicrotask(() => {
        batchNotifyFn(() => {
          originalQueue.forEach((callback) => {
            notifyFn(callback)
          })
        })
      })
    }
  }

  /**
   * 执行事务，事务中的所有通知将被批量执行
   * @param callback 事务中的操作
   * @returns 事务执行结果
   */
  const batch = <T>(callback: () => T): T => {
    let result
    transactions++
    try {
      result = callback()
    }
    finally {
      transactions--
      if (!transactions)
        flush()
    }
    return result
  }

  /**
   * 调度通知，根据当前是否在事务中决定是直接执行还是加入队列
   * @param callback 待执行的通知回调
   */
  const schedule = (callback: NotifyCallback): void => {
    if (transactions) {
      queue.push(callback)
    }
    else {
      scheduleMicrotask(() => {
        notifyFn(callback)
      })
    }
  }

  /**
   * 批量调用，包装一个函数使其所有调用都被批量执行
   * @param callback 待包装的函数
   * @returns 包装后的函数
   */
  const batchCalls = <T extends (...args: any[]) => any>(callback: T): T => {
    return ((...args: any[]) => {
      schedule(() => {
        callback(...args)
      })
    }) as any
  }

  /**
   * 设置自定义通知函数
   * @param fn 自定义的通知函数
   */
  const setNotifyFunction = (fn: NotifyFunction) => {
    notifyFn = fn
  }

  /**
   * 设置自定义批量通知函数
   * @param fn 自定义的批量通知函数
   */
  const setBatchNotifyFunction = (fn: BatchNotifyFunction) => {
    batchNotifyFn = fn
  }

  // 返回通知管理器的方法
  return {
    batch,
    batchCalls,
    schedule,
    setNotifyFunction,
    setBatchNotifyFunction,
  } as const
}

// 定义一个通知管理器的单例
export const scheduleManager = createNotifyManager()
