import { subgraphFetch, gql, Big } from './utils.js'

import { sub } from 'date-fns'

const toHumanDate = (date) =>
  date.toLocaleDateString('en-GB', { timeZone: 'UTC' })

const toHumanEthAmount = (value) =>
  Big(value).div(Big('1e18')).toFixed(7).toString()

const dayInMs = 1000 * 60 * 60 * 24

const fullDays = Math.floor(new Date() / dayInMs) * dayInMs

// 30 days ago range to last full day
const monthStartEnd = {
  from: sub(new Date(fullDays), { days: 30 }),
  to: sub(new Date(fullDays), { seconds: 1 }),
}

// Converting JS dates to unix time
const blockTimes = {
  from: Math.round(monthStartEnd.from / 1000),
  to: Math.round(monthStartEnd.to / 1000),
}

const monthRewardsQuery = gql`
  {
    totalRewards(first: 1000, where: {
        blockTime_gte: ${blockTimes.from},
        blockTime_lte: ${blockTimes.to} }) {
          totalRewards
    }
  }
`

const rewards = (await subgraphFetch(monthRewardsQuery)).totalRewards
const sum = rewards.reduce(
  (acc, item) => acc.plus(Big(item.totalRewards)),
  Big(0)
)
console.log(
  'Rewarded our customers',
  toHumanEthAmount(sum),
  'StETH in the last 30 days',
  toHumanDate(monthStartEnd.from),
  '-',
  toHumanDate(monthStartEnd.to)
)
