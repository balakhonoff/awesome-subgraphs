import {
  lidoFuncCall,
  getTestAddresses,
  calculateAddressBalance,
} from './utils/index.js'

const ADDRESSES_TO_TEST = 100
const timePerAddress = 0.5 // seconds
const timeout = ADDRESSES_TO_TEST * timePerAddress * 1000 // in ms

/**
NOTE: This test is experimental, should not work.
**/

test(
  'rewards',
  async () => {
    const addresses = await getTestAddresses(ADDRESSES_TO_TEST)

    for (const address of addresses) {
      console.log(address)

      const realBalance = (await lidoFuncCall('balanceOf', address)).toString()
      const subgraphBalance = (
        await calculateAddressBalance(address)
      ).toString()

      expect(subgraphBalance).toEqual(realBalance)
    }
  },
  timeout
)
