import type { PromptObject } from 'prompts'

export function getQuestions(mode: 'init' | 'switch' = 'init') {
  const isSwitch = mode === 'switch'

  return [
    {
      name: 'account',
      type: 'text',
      message: 'bot uin',
      validate: (input) => {
        return /^[1-9]\d{4,9}$/.test(input.trim()) ? true : 'invalid uin'
      },
      format: (e) => Number(e.trim())
    },
    {
      name: 'platform',
      type: 'select',
      message: 'platform',
      initial: 0,
      choices: [
        {
          title: 'iPad',
          value: 5
        },
        {
          title: 'aPhone',
          value: 1
        },
        {
          title: 'aPad',
          value: 2
        },
        {
          title: 'MacOS',
          value: 4
        },
        {
          title: 'aWatch',
          value: 3
        }
      ]
    },
    {
      name: 'admins',
      type: isSwitch ? null : 'list',
      message: 'bot admins',
      separator: ' ',
      format: (list: string[]) => [...new Set(list.filter((e) => !!e).map(Number))],
      validate: (list: string) => {
        return /^[1-9]\d{4,9}(\s+[1-9]\d{4,9})*$/.test(list.trim()) ? true : 'invalid admin uin'
      }
    },
    {
      name: 'login_mode',
      type: 'select',
      message: 'login mode',
      initial: 0,
      choices: [
        {
          title: 'password',
          value: 'password'
        },
        {
          title: 'qrcode',
          value: 'qrcode'
        }
      ]
    },
    {
      name: 'password',
      type: (login_mode) => {
        return login_mode === 'password' ? 'text' : null
      },
      message: 'bot password',
      style: 'password',
      validate: (password) => {
        return /^.{6,16}$/.test(password.trim()) ? true : 'invalid password'
      },
      format: (password) => password.trim()
    },
    {
      name: 'device_mode',
      type: (prev) => {
        return prev === 'qrcode' ? null : 'select'
      },
      initial: 0,
      message: 'device mode',
      choices: [
        {
          title: 'sms',
          value: 'sms'
        },
        {
          title: 'qrcode',
          value: 'qrcode'
        }
      ]
    }
  ] as PromptObject[]
}
