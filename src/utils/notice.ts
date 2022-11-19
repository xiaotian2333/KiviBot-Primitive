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

export const error = (msg: string) => {
  console.log(`${colors.red('Error:')} ${msg}`)
}

const notice = { info, warn, success, error }

export default notice
