import colors from './colors'

export const info = (msg: string) => {
  console.log(`${colors.blue('Info:')} ${msg}`)
}

export const warn = (msg: string) => {
  console.log(`${colors.yellow('Warn:')} ${msg}`)
}

export const success = (msg: string) => {
  console.log(`${colors.green('Sucess:')} ${msg}`)
}

export const faild = (msg: string) => {
  console.log(`${colors.red('Faild:')} ${msg}`)
}

const notice = { info, warn, success, faild }

export default notice
