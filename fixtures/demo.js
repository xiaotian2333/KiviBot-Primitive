fetch('https://api.14k.top/api/signJson', {
  method: 'POST',
  body: JSON.stringify({
    json: JSON.stringify({
      app: 'com.tencent.structmsg',
      xyz: 1341806518,
      desc: 'xyz',
      config: { forward: 1, round: 0, type: 'normal', showSender: 1, menuMode: 0 },
      meta: {},
      prompt: '小叶子',
      ver: '0.0.1.20',
      view: 'news'
    }),
    uuid: 'd7b7ff70-b8fd-11ed-bf62-c999fc07e150'
  })
})
  .then((e) => e.json())
  .then(console.log)
