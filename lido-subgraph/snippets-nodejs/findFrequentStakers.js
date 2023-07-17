import { subgraphFetch, gql } from './utils.js'

const userTransfersQuery = gql`
  {
    lidoTransfers(first: 1000, skip: 1000) {
      from
      to
    }
  }
`

const transfers = (await subgraphFetch(userTransfersQuery)).lidoTransfers

const grouped = transfers.reduce((a, b) => {
  var i = a.findIndex((x) => x.to === b.to)
  return i === -1 ? a.push({ to: b.to, times: 1 }) : a[i].times++, a
}, [])

const sorted = grouped.sort((a, b) => b.times - a.times)

const withAdequateAmount = sorted.filter((x) => x.times > 1 && x.times < 5)

console.log(withAdequateAmount)
