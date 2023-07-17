import { subgraphFetch, gql, getBalanceFromShares, BigNumber } from './utils.js'

const rpcMode = false

const initialPeriodEnabled = true
const firstTxBlock = 11480180

const tailingPeriodEnabled = true

const stepBlocks = 100

const genTotalsQuery = (block) => gql`
  {
    totals(id: "", block: { number: ${block} }) {
      totalPooledEther
      totalShares
    }
  }
`

const ratioQuery = gql`
  {
    totalRewards(first: 10000, orderBy: block, orderDirection: asc) {
      block
    }
  }
`

const lastSubmitQuery = gql`
  {
    lidoSubmissions(first: 1, orderBy: block, orderDirection: desc) {
      block
    }
  }
`

// Example USD values from 03.09.2021
const sharesChecks = [
  '17253336101171480', // 70usd
  '453884371982397608502', // 2mil usd
  '22253111414175281724765', // 90mil usd
].map((x) => BigNumber.from(x))

for (const shares of sharesChecks) {
  console.log('Checking shares:', shares.toString())

  const reports = (await subgraphFetch(ratioQuery)).totalRewards

  const lastBlock = (await subgraphFetch(lastSubmitQuery)).lidoSubmissions.block

  const periods = []

  for (let i = 0; i < reports.length - 1; i++) {
    periods.push({
      start: parseInt(reports[i].block),
      end: parseInt(reports[i + 1].block),
    })
  }

  if (initialPeriodEnabled) {
    // Period before first rewards
    periods.unshift({
      start: firstTxBlock,
      end: periods[0].start,
    })
  }

  if (tailingPeriodEnabled) {
    // Period after last rewards
    periods.push({
      start: periods.at(-1).end,
      end: lastBlock,
    })
  }

  let fluctuationsNumber = 0
  let largestFluctuation = BigNumber.from(0)
  let totalOfFluctuations = BigNumber.from(0)

  for (const period of periods) {
    let firstBalance = null
    let last = null

    for (let block = period.start; block < period.end; block += stepBlocks) {
      let balance = null

      if (rpcMode) {
        balance = await getBalanceFromShares(shares, { blockTag: block })
      } else {
        const totals = (await subgraphFetch(genTotalsQuery(block))).totals
        balance = shares.mul(totals.totalPooledEther).div(totals.totalShares)
      }

      // Save initial balance for the period
      if (block === period.start) {
        firstBalance = balance
      }

      if (last && !balance.eq(last)) {
        const fluctuation = balance.sub(last).abs()

        totalOfFluctuations = totalOfFluctuations.add(fluctuation)

        if (fluctuation.gt(largestFluctuation)) {
          largestFluctuation = fluctuation
        }

        fluctuationsNumber++
      }

      last = balance
    }
    if (firstBalance) {
      const periodDifference = last.sub(firstBalance)
      if (periodDifference.gt(0)) {
        console.log(
          'Start-End balance difference detected in period',
          period.start,
          '-',
          period.end,
          periodDifference.toString()
        )
      }
    }
  }
  console.log('Fluctuations:', fluctuationsNumber)
  console.log('Largest Fluctuation:', largestFluctuation.toNumber())
  console.log('Total Of Fluctuations:', totalOfFluctuations.toNumber())
}
