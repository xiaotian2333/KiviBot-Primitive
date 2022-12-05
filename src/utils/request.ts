import axios from 'axios'
import https from 'node:https'

const ChromeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'

const http = axios.create({
  headers: { 'User-Agent': ChromeUA },
  timeout: 6000,
  validateStatus: () => true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

export { axios, http }
