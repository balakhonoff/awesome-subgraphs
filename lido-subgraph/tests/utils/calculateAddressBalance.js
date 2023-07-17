import { gql } from 'graphql-request'
import { subgraphFetch, BigNumber } from './index.js'

export const calculateAddressBalance = async (address) => {
  const submissionsQuery = gql`
	query ($first: Int, $skip: Int, $block: Block_height) {
	  lidoSubmissions(first: $first, skip: $skip, block: $block, where: {sender: "${address}"}) {
		amount
		shares
    
		block
    transactionIndex
	  }
	}
	`

  const transfersInboundQuery = gql`
	query ($first: Int, $skip: Int, $block: Block_height) {
		  lidoTransfers (first: $first, skip: $skip, block: $block, where: {to: "${address}"}) {
      value
			shares
			to
      
      mintWithoutSubmission
      
			block
      transactionIndex
		  }
	}
	`

  const transfersOutboundQuery = gql`
	query ($first: Int, $skip: Int, $block: Block_height) {
		  lidoTransfers (first: $first, skip: $skip, block: $block, where: {from: "${address}"}) {
      value
			shares
			to
      
			block
      transactionIndex
		  }
	}
	`

  const ratioQuery = gql`
    query ($first: Int, $skip: Int, $block: Block_height) {
      totalRewards(
        first: $first
        skip: $skip
        block: $block
        orderBy: block
        orderDirection: asc
      ) {
        id

        totalRewards

        totalPooledEtherBefore
        totalPooledEtherAfter
        totalSharesBefore
        totalSharesAfter

        block
        transactionIndex
      }
    }
  `

  const submissions = (await subgraphFetch(submissionsQuery)).lidoSubmissions
  const transfersInbound = (await subgraphFetch(transfersInboundQuery))
    .lidoTransfers
  const transfersOutbound = (await subgraphFetch(transfersOutboundQuery))
    .lidoTransfers

  const sortTxs = (a, b) =>
    a.block - b.block ||
    a.transactionIndex - b.transactionIndex ||
    a.value - b.value

  const transactions = [
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
  ].sort(sortTxs)

  const reports = (await subgraphFetch(ratioQuery)).totalRewards

  // Adding rewards to each day of oracle reports
  for (let report of reports) {
    // Find all transfers before this blocktime
    const usefulTransfers = transactions.filter((transfer) =>
      transfer.block !== report.block
        ? parseInt(transfer.block) < parseInt(report.block)
        : parseInt(transfer.transactionIndex) <
          parseInt(report.transactionIndex)
    )

    // Sum of all stakes before this moment
    const sumOfShares = usefulTransfers.reduce((aсс, item) => {
      // Can be null for transfers from 0x0 (minting)
      const shares = item.shares || 0

      return item.direction !== 'outbound' ? aсс.add(shares) : aсс.sub(shares)
    }, BigNumber.from(0))

    const balanceBefore = sumOfShares
      .mul(report.totalPooledEtherBefore)
      .div(report.totalSharesBefore)

    const balanceAfter = sumOfShares
      .mul(report.totalPooledEtherAfter)
      .div(report.totalSharesAfter)

    const rewards = balanceAfter.sub(balanceBefore)

    report.balanceBefore = balanceBefore
    report.balanceAfter = balanceAfter
    report.rewards = rewards
  }

  // Calculating balances
  const together = [
    ...transactions,
    ...reports.map((x) => ({ ...x, type: 'reward' })),
  ].sort(sortTxs)

  const balance = together.reduce((acc, item) => {
    const amount = item.value || item.rewards || 0

    return item.direction !== 'outbound' ? acc.add(amount) : acc.sub(amount)
  }, BigNumber.from(0))

  return balance
}
