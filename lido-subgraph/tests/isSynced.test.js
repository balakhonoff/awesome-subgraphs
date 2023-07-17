import { jest } from '@jest/globals'
import { ethCall, getLastIndexedBlock } from './utils/index.js'

jest.setTimeout(20000)

jest.retryTimes(3)

test('isSyncedLoose', async () => {
  const currentBlock = parseInt((await ethCall('getBlock', 'latest')).number)
  const acceptedMinimum = currentBlock - 50

  const subgraphBlock = parseInt(await getLastIndexedBlock())

  expect(subgraphBlock).toBeGreaterThanOrEqual(acceptedMinimum)
})
