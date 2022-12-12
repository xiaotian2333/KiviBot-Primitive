/** 延时异步函数，返回一个 Promise，指定时间（毫秒）后 resolve */
export async function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
