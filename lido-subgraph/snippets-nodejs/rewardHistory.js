// Big number lib
import { Big, BigDecimal } from './utils/index.js'
// Date utilities
import { fromUnixTime, format } from 'date-fns'
// Simple GraphQL requester
import { subgraphFetch } from './utils/index.js'

// GraphQL Queries
import {
  submissionsQuery,
  totalRewardQuery,
  transferInQuery,
  transferOutQuery,
} from './queries/index.js'

// Address to track
const ADDRESS = ''

// Helpers to display data in easily readable form
const weiToHumanReadable = (wei) => BigDecimal(wei).div('1e18').toString()
const dateToHumanReadable = (date) => format(fromUnixTime(date), 'dd.MM.yyyy')

// Sort by block, logIndex and out first and then in
const sortTxs = (a, b) =>
  a.block - b.block ||
  a.logIndex - b.logIndex ||
  (a.direction === 'In' ? 1 : -1)

const queryVars = {
  address: ADDRESS,
}

// Subgraph Requests: staking, oracle reports, transfers in and out
const submissions = (await subgraphFetch(submissionsQuery, queryVars))
  .lidoSubmissions
const reports = (await subgraphFetch(totalRewardQuery)).totalRewards
const transfersIn = (await subgraphFetch(transferInQuery, queryVars))
  .lidoTransfers
const transfersOut = (await subgraphFetch(transferOutQuery, queryVars))
  .lidoTransfers

// Joining transfers in and out
const transfers = [
  ...submissions.map((x) => ({ ...x, type: 'Staking' })),
  ...transfersIn.map((x) => ({
    ...x,
    type: 'Transfer',
    direction: 'In',
    value: Big(x.value),
  })),
  ...transfersOut.map((x) => ({
    ...x,
    type: 'Transfer',
    direction: 'Out',
    value: Big(x.value),
  })),
].sort(sortTxs)

// Picking which balance direction we need
for (let transfer of transfers) {
  transfer.balance =
    transfer.type === 'Staking'
      ? Big(transfer.balanceAfter)
      : transfer.direction === 'In'
      ? Big(transfer.balanceAfterIncrease || 0)
      : Big(transfer.balanceAfterDecrease || 0)
}

for (let report of reports) {
  report.type = 'Reward'

  // Find all transfers before rewards
  const usefulTransfers = transfers.filter((transfer) =>
    transfer.block !== report.block
      ? parseInt(transfer.block) < parseInt(report.block)
      : parseInt(transfer.logIndex) < parseInt(report.logIndex)
  )

  // Sum of all shares before this moment
  const shares = usefulTransfers.reduce((aсс, item) => {
    // Can be null for transfers from 0x0 (minting)
    const shares = Big(item.shares || 0)

    return item.direction !== 'Out' ? aсс.plus(shares) : aсс.minus(shares)
  }, Big(0))

  report.shares = shares

  // Early exit if no shares
  if (shares.eq(0)) {
    report.balance = Big(0)
    report.rewards = Big(0)
    continue
  }

  const balanceBefore = shares
    .times(report.totalPooledEtherBefore)
    .div(report.totalSharesBefore)

  const balanceAfter = shares
    .times(report.totalPooledEtherAfter)
    .div(report.totalSharesAfter)

  const rewards = balanceAfter.sub(balanceBefore)

  report.balance = balanceAfter
  report.rewards = rewards
}

// Hiding unnecessary output
const reportsWithShares = reports.filter((day) => day.shares.gt(0))
const hiddenTransfersOnSubmit = transfers.filter(
  (x, ix, array) =>
    !(
      x.type === 'Transfer' &&
      x.direction === 'In' &&
      x.from === '0x0000000000000000000000000000000000000000' &&
      array[ix - 1]?.type === 'Staking'
    )
)

// Joining and sorting
const merged = [...hiddenTransfersOnSubmit, ...reportsWithShares].sort(sortTxs)

const withChange = merged.map((x) => ({
  ...x,
  change: x.amount || x.value || x.rewards,
}))

for (const x of withChange) {
  console.log(
    dateToHumanReadable(x.blockTime),
    x.block,
    `${x.type} ${x.type === 'Transfer' ? x.direction : ''}`,
    weiToHumanReadable(x.change),
    weiToHumanReadable(x.balance)
  )
}
