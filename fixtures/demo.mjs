import fg from 'fast-glob'
import minimist from 'minimist'
import path from 'node:path'
import sa from 'string2argv'

// console.log(path.resolve('.'))
// console.log(await fg('lib/**/*.js'))

console.log(minimist(sa('echo demo -dsa --ds "23 asd"')))
