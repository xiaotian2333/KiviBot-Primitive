import notice from './notice'

const exitWithError = (msg: string) => {
  notice.faild(msg)
  process.exit(1)
}

export default exitWithError
