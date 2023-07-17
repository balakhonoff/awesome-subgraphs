import fs from 'fs'
import { sub, getUnixTime, fromUnixTime, format, startOfDay } from 'date-fns'
import { subgraphFetch, gql, Big, BigDecimal } from './utils.js'

const MONTHS_BACK = 3

const toEth = (number) => BigDecimal(number).div(1e18).round(2).toNumber()

const formatDate = (unixTime) => format(fromUnixTime(unixTime), 'dd/MM/yyyy')

const startRaw = sub(new Date(), { months: MONTHS_BACK })

const startDay = startOfDay(startRaw)

// date-fns uses Date, which is local, so we compensate for the offset here
const start = getUnixTime(
  new Date(startDay.valueOf() - startDay.getTimezoneOffset() * 60 * 1000)
)

// Make sure we are using self-hosted Graph nodes with no limits or this will fail
const query = gql`
  {
    lidoSubmissions(first: 100000, where: {blockTime_gte: ${start}}, orderBy: "blockTime") {
      sender
      amount
      block
      blockTime
      transactionHash
    }
  }
`

const items = (await subgraphFetch(query)).lidoSubmissions

console.log('Fetched', items.length, 'stakings for', MONTHS_BACK, 'months')

const days = items.reduce((acc, item) => {
  const date = formatDate(item.blockTime)

  if (!acc.hasOwnProperty(date)) {
    acc[date] = { submits: [], total: Big(0) }
  }

  acc[date]['submits'].push(item)
  acc[date]['total'] = acc[date]['total'].plus(item.amount)

  return acc
}, {})

Object.entries(days).forEach(([date, items]) =>
  console.log(
    date,
    items.submits.length,
    'submits for',
    toEth(items.total),
    'ETH'
  )
)

await fs.promises.writeFile('submits.json', JSON.stringify(days))
