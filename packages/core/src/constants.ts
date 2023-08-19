export const CONFIG_FILE_NAME = 'kivi.json'
export const DEFAULT_SIGN_API = 'https://qsign.viki.moe/sign'
export const SIGN_API_ADDR = process.env.SIGN_API_ADDR || DEFAULT_SIGN_API

// oicq 登录协议：1 为安卓手机, 2 为安卓平板, 3 为安卓手表, 4 为 MacOS, 5 为 iPad
export const DEVICE_MAP: Record<number, string> = {
  1: '安卓 Phone',
  2: '安卓 Pad',
  3: '安卓 Watch',
  4: 'MacOS',
  5: 'iPad',
  6: '备选协议',
}
