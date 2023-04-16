import ora from 'ora'

import { notice, update as updatePackage } from '@/utils'

const loading = ora()

export async function update() {
  loading.start(`checking update...`)

  try {
    const { isOK, info } = await updatePackage()
    loading[isOK ? 'succeed' : 'fail'](info)
  } catch (e) {
    loading.stop()
    console.log(e)
    notice.error('update failed, check the log above')
  }
}
