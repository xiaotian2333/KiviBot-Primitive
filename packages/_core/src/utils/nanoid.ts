import { nanoid, customAlphabet } from 'nanoid'
import { nanoid as fastId, customAlphabet as fastCustomAlphabet } from 'nanoid/non-secure'

const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz'

const randomId = customAlphabet(alphabet, 6)
const fastRandomId = fastCustomAlphabet(alphabet, 6)

export { randomId, fastRandomId, nanoid, fastId }
