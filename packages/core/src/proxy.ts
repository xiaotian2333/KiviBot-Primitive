export function createObservable<T = any>(
  obj: T & Record<PropertyKey, any>,
  handleChange: (newObj: T & Record<PropertyKey, any>) => void,
) {
  return new Proxy(obj, {
    set(target, key, value, receiver) {
      const oldValue = obj[key]
      const result = Reflect.set(target, key, value, receiver)

      if (!Object.is(oldValue, value)) {
        handleChange(obj)
      }

      return result
    },
    // 拦截数组方法监听改动
    apply(target, thisArg, args) {
      const methodName = args[0]
      const method = Array.prototype[methodName]
      const result = method.apply(target, args)

      if (['push', 'pop', 'shift', 'slice'].includes(methodName)) {
        handleChange(obj)
      }

      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key)

      handleChange(obj)

      return result
    },
  })
}
