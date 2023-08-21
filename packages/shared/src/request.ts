import { axios } from 'icqq'
import https from 'node:https'

const ChromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/108.0.0.0'

export const http = axios.create({
  headers: { 'User-Agent': ChromeUA },
  timeout: 12000,
  validateStatus: () => true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
}) as axios.AxiosStatic
