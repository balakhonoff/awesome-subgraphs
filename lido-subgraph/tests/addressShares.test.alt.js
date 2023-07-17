import {
  getTestAddresses,
  getAddressShares,
  calculateShares,
} from './utils/index.js'

// 1 addr 1 test version
const ADDRESSES_TO_TEST = 100
const addresses = await getTestAddresses(ADDRESSES_TO_TEST)

test.each(addresses)('%j', async (address) => {
  const realShareAmount = (await getAddressShares(address)).toString()
  const subgraphShareAmount = (await calculateShares(address)).toString()

  expect(subgraphShareAmount).toEqual(realShareAmount)
})
