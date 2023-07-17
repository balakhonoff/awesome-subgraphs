import { subgraphFetch } from './index.js'
import { getIsMainnet, getIsLimited } from '../config.js'

import { gql } from 'graphql-request'

// Enough for random selection, saves us from brute forcing entity amount
const MAX_LIMITED = 5000
const MAX_UNLIMITED = 200000

const IMPORTANT_ADDRESSES = [
  // Lido Treasury (Aragon Agent)
  '0x3e40d73eb977dc6a537af587d48316fee66e9c8c',
  // Lido Node Operator #0
  '0xdd4bc51496dc93a0c47008e820e0d80745476f22',
  // Lido Node Operator #1
  '0x8d689476eb446a1fb0065bffac32398ed7f89165',
  // Lido Node Operator #2
  '0x9a66fd7948a6834176fbb1c4127c61cb6d349561',
  // Curve stETH pool
  '0xdc24316b9ae028f1497c275eb9192a3ea0f67022',
  // 1inch LDO-stETH pool
  '0x1f629794b34ffb3b29ff206be5478a52678b47ae',
]

const genQuery = (first, skip) => gql`
  query ($block: Block_height) {
    lidoTransfers(first: ${first}, skip: ${skip}, block: $block) {
      from
      to
    }
  }
`

export const getTestAddresses = async (amount = 30, skipImportant = false) => {
  const max = getIsLimited() ? MAX_LIMITED : MAX_UNLIMITED
  const maxSkip = max - amount
  const randomSkip = Math.floor(Math.random() * maxSkip)

  const query = genQuery(amount, randomSkip)
  const transfers = (await subgraphFetch(query)).lidoTransfers

  const uniqueAddresses = transfers.reduce((acc, item) => {
    acc.add(item.from)
    acc.add(item.to)
    return acc
  }, new Set())

  // Mint address
  uniqueAddresses.delete('0x0000000000000000000000000000000000000000')

  const shuffled = [...uniqueAddresses].sort(() => 0.5 - Math.random())

  if (getIsMainnet() && !skipImportant) {
    // Make sure some important addresses get into our list:
    shuffled.unshift(...IMPORTANT_ADDRESSES)
  }

  const sliced = shuffled.slice(0, amount)

  return sliced
}
