import { gql } from 'graphql-request'
import { subgraphFetch, BigNumber } from './index.js'

export const calculateShares = async (address) => {
  const submissionsQuery = gql`
    query ($first: Int, $skip: Int, $block: Block_height) {
      lidoSubmissions(
        first: $first
        skip: $skip
        block: $block
        where: { sender: "${address}" }
      ) {
        amount
        shares
        block
      }
    }
  `

  const transfersInboundQuery = gql`
    query ($first: Int, $skip: Int, $block: Block_height) {
      lidoTransfers(
        first: $first
        skip: $skip
        block: $block
        where: { to: "${address}" }
      ) {
        shares
        to
        block
      }
    }
  `

  const transfersOutboundQuery = gql`
    query ($first: Int, $skip: Int, $block: Block_height) {
      lidoTransfers(
        first: $first
        skip: $skip
        block: $block
        where: { from: "${address}" }
      ) {
        shares
        to
        block
      }
    }
  `
  const submissions = (await subgraphFetch(submissionsQuery)).lidoSubmissions
  const transfersInbound = (await subgraphFetch(transfersInboundQuery))
    .lidoTransfers
  const transfersOutbound = (await subgraphFetch(transfersOutboundQuery))
    .lidoTransfers

  const together = [
    ...submissions.map((x) => ({ ...x, type: 'submission' })),
    ...transfersInbound.map((x) => ({
      ...x,
      type: 'transfer',
      direction: 'inbound',
    })),
    ...transfersOutbound.map((x) => ({
      ...x,
      type: 'transfer',
      direction: 'outbound',
    })),
  ].sort((a, b) => a.block - b.block)

  let shares = BigNumber.from(0)

  for (const item of together) {
    const isStaking = item.type === 'submission'
    const isOut = !isStaking && item.direction === 'outbound'

    const txShares = item.shares || BigNumber.from(0)

    shares = isOut ? shares.sub(txShares) : shares.add(txShares)
  }

  return shares
}
