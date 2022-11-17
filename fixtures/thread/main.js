import { MessageChannel } from 'node:worker_threads';
const { port1, port2 } = new MessageChannel();
// const bc = new BroadcastChannel('hello')
// if (isMainThread) {
//   let c = 0
//   bc.onmessage = (event) => {
//     console.log(event.data)
//     if (++c === 10) {
//       bc.close()
//     }
//   }
//   for (let n = 0; n < 10; n++) {
//     const worker = new Worker(__filename)
//   }
// } else {
//   bc.postMessage('hello from every worker')
//   bc.close()
// }
