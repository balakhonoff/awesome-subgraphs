import { subgraphFetch, gql, Big } from './utils.js'
import { ADDRESS } from './config.js'

const submissionsQuery = gql`
  {
    lidoSubmissions(first: 1000, where: { sender: "${ADDRESS}" }) {
      amount
      shares
      block
    }
  }
`

const transfersInboundQuery = gql`
  {
    lidoTransfers(first: 1000, where: { to: "${ADDRESS}" }) {
      shares
      to
      block
    }
  }
`

const transfersOutboundQuery = gql`
  {
    lidoTransfers(first: 1000, where: { from: "${ADDRESS}" }) {
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

let shares = Big(0)

for (const item of together) {
  const isStaking = item.type === 'submission'
  const isOut = !isStaking && item.direction === 'outbound'

  const currentShares = item.shares || 0

  shares = isOut ? shares.sub(currentShares) : shares.add(currentShares)

  console.log(
    isStaking ? 'Staking' : isOut ? 'Transfer Outbound' : 'Transfer Inbound',
    item.shares,
    '->',
    shares.toString(),
    item.block
  )
}

console.log('Final', shares.toString())
