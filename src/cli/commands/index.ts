import { create } from './create'
import { fix } from './fix'
import { init } from './init'
import { install } from './install'
import { deploy, stop, del, log, list } from './pm2'
import { start } from './start'
import { update } from './update'

export const cmds = {
  create,
  deploy,
  fix,
  init,
  install,
  list,
  log,
  start,
  stop,
  update,
  delete: del
}
