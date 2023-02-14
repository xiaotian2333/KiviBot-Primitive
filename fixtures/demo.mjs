import fg from 'fast-glob'
import path from 'node:path'

console.log(path.resolve('.'))
console.log(await fg('lib/**/*.js'))
