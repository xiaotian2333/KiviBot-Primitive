import axios from 'axios'
import https from 'node:https'

const ChromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/108.0.0.0'

const http = axios.create({
  headers: { 'User-Agent': ChromeUA },
  timeout: 8000,
  validateStatus: () => true,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

export { axios, http }
