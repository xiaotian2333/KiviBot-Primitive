// edit from https://github.com/takayama-lily/oicq/blob/main/lib/internal/contactable.ts#L422-L511

import { escapeXml, gzip, md5, timestamp, uuid } from 'movo/lib/common'
import { pb } from 'movo/lib/core'
import { drop } from 'movo/lib/errors'
import { CmdID, highwayUpload } from 'movo/lib/internal'
import { Converter, PrivateMessage, rand2uuid } from 'movo/lib/message'
import { randomBytes } from 'node:crypto'
import { Readable } from 'node:stream'

import type { Client, Forwardable, XmlElem } from 'movo'
import type { Image } from 'movo/lib/message'

/** 制作合并转发消息，可自定义标题、内容、底部说明文字 */
export async function makeForwardMsg(
  this: Client,
  msgList: Forwardable[] | Forwardable,
  title = '转发的聊天记录',
  desc = '轻按查看详情',
  dm = true
): Promise<XmlElem> {
  const that = (dm ? this.pickFriend : this.pickGroup)(this.uin)
  if (!Array.isArray(msgList)) msgList = [msgList]
  const nodes = []
  const makers: Converter[] = []
  let imgs: Image[] = []
  let preview = ''
  let cnt = 0
  for (const fake of msgList) {
    const maker = new Converter(fake.message, { dm, cachedir: this.config.data_dir })
    makers.push(maker)
    const seq = randomBytes(2).readInt16BE()
    const rand = randomBytes(4).readInt32BE()
    let nickname = String(fake.nickname || fake.user_id)
    if (!nickname && fake instanceof PrivateMessage)
      nickname =
        this.fl.get(fake.user_id)?.nickname || this.sl.get(fake.user_id)?.nickname || nickname
    if (cnt < 4) {
      cnt++
      if (!desc) {
        preview += `<title color="#777777" size="26">${`${escapeXml(nickname)}: ${escapeXml(
          maker.brief.slice(0, 50)
        )}`}</title>`
      }
    }
    nodes.push({
      1: {
        1: fake.user_id,
        2: this.uin,
        3: dm ? 166 : 82,
        4: dm ? 11 : null,
        5: seq,
        6: fake.time || timestamp(),
        7: rand2uuid(rand),
        9: dm
          ? null
          : {
              1: this.uin,
              4: nickname
            },
        14: dm ? nickname : null,
        20: {
          1: 0,
          2: rand
        }
      },
      3: {
        1: maker.rich
      }
    })
  }
  if (desc) preview = `<title color="#777777" size="26">${desc}</title>`
  for (const maker of makers) imgs = [...imgs, ...maker.imgs]
  if (imgs.length) await that.uploadImages(imgs)
  const compressed = await gzip(
    pb.encode({
      1: nodes,
      2: {
        1: 'MultiMsg',
        2: {
          1: nodes
        }
      }
    })
  )
  const resId = await uploadMultiMsg.bind(this)(compressed)
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<msg brief="[聊天记录]" m_fileName="${uuid().toUpperCase()}" action="viewMultiMsg" tSum="${
    nodes.length
  }" flag="3" m_resid="${resId}" serviceID="35" m_fileSize="${
    compressed.length
  }"><item layout="1"><title color="#000000" size="34"> ${title} </title>${preview}<hr></hr><summary color="#808080" size="26"> ${`查看 ${nodes.length} 条转发消息`} </summary></item><source name="聊天记录"></source></msg>`

  return {
    type: 'xml',
    data: xml,
    id: 35,
    toString() {
      return `[XML 消息: ${title}]`
    }
  } as XmlElem
}

async function uploadMultiMsg(this: Client, compressed: Buffer) {
  const body = pb.encode({
    1: 1,
    2: 5,
    3: 9,
    4: 3,
    5: this.apk.version,
    6: [
      {
        1: this.uin,
        2: compressed.length,
        3: md5(compressed),
        4: 3,
        5: 0
      }
    ],
    8: 1
  })
  const payload = await this.sendUni('MultiMsg.ApplyUp', body)
  const rsp = pb.decode(payload)[2]
  if (rsp[1] !== 0) drop(rsp[1], rsp[2]?.toString() || 'unknown MultiMsg.ApplyUp error')
  const buf = pb.encode({
    1: 1,
    2: 5,
    3: 9,
    4: [
      {
        2: this.uin,
        4: compressed,
        5: 2,
        6: rsp[3].toBuffer()
      }
    ]
  })
  const ip = rsp[4]?.[0] || rsp[4]
  const port = rsp[5]?.[0] || rsp[5]
  await highwayUpload.call(
    this,
    Readable.from(Buffer.from(buf), { objectMode: false }),
    {
      cmdid: CmdID.MultiMsg,
      md5: md5(buf),
      size: buf.length,
      ticket: rsp[10].toBuffer()
    },
    ip,
    port
  )
  return rsp[2].toString() as string
}
