import {
  getTestAddresses,
  getAddressShares,
  calculateShares,
} from './utils/index.js'

const ADDRESSES_TO_TEST = 100
const timePerAddress = 0.5 // seconds
const timeout = ADDRESSES_TO_TEST * timePerAddress * 1000 // in ms

test(
  'shares of 100 random addresses',
  async () => {
    const addresses = await getTestAddresses(ADDRESSES_TO_TEST)

    for (const address of addresses) {
      // Log will only be shown on test failure via a custom reporter
      console.log(address)

      const realShareAmount = (await getAddressShares(address)).toString()
      const subgraphShareAmount = (await calculateShares(address)).toString()

      expect(subgraphShareAmount).toEqual(realShareAmount)
    }
  },
  timeout
)
