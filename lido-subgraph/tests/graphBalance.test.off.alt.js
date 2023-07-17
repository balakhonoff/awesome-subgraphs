import fs from 'fs'
import ethers from 'ethers'
import { jest } from '@jest/globals'

const BILLING_CONTRACT_ADDRESS = '0x10829DB618E6F520Fa3A01c75bC6dDf8722fA9fE'
const LIDO_ADDRESS = process.env.THEGRAPH_BILLING_ADDRESS
const THRESHOLD_ETH = 1 * 1000 // 1k GRT

jest.setTimeout(10000)

jest.retryTimes(3)

test('The Graph balance check', async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    'https://polygon-rpc.com'
  )
  const abi = JSON.parse(fs.readFileSync('abis/Billing.json'))
  const contract = new ethers.Contract(BILLING_CONTRACT_ADDRESS, abi, provider)
  const balanceWei = await contract.userBalances(LIDO_ADDRESS)
  const balanceEth = balanceWei.div(ethers.constants.WeiPerEther).toNumber()

  expect(balanceEth).toBeGreaterThan(THRESHOLD_ETH)
})
