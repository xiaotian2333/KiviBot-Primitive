import notice from './notice'

const exitWithError = (msg: string) => {
  notice.error(msg)
  process.exit(1)
}

export default exitWithError
