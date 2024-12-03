/**
 * 注册一个监听器来捕获未处理的Promise拒绝事件
 * 这个函数旨在帮助开发者在异步操作中识别和处理潜在的错误
 * 通过在节点环境中监听'unhandledRejection'事件，它可以提供关于什么Promise被拒绝以及原因的详细信息
 */
export function catchError() {
  // 监听'unhandledRejection'事件，当出现未处理的Promise拒绝时触发
  // 'reason'参数提供了拒绝的原因，'p'参数是被拒绝的Promise对象
  process.on('unhandledRejection', (reason, p) => {
    // 输出关于未处理拒绝的详细信息，包括Promise对象和拒绝原因
    console.log('Promise: ', p, 'Reason: ', reason)
  })
}
