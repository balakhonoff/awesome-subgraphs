import { subgraphFetch, gql, Big } from './utils.js'
import { ADDRESS } from './config.js'

const generateQuery = (referral, skip) => gql`
  {
    lidoSubmissions(
      skip: ${skip}
      first: 1000
      where: { referral: "${referral}" }
      orderBy: blockTime
      orderDirection: desc
    ) {
      sender
      amount
      blockTime
    }
  }
`

const fetchToLimits = async (referral) => {
  const subgraphLimit = 6000
  let skip = 0
  let gotItems = 0
  let results = []

  // We do respect hosted Subgraph's limit here
  while ((gotItems === 0 || gotItems % 1000 === 0) && skip < subgraphLimit) {
    const items = (await subgraphFetch(generateQuery(referral, skip)))
      .lidoSubmissions

    skip += 1000
    gotItems += items.length

    results.push(...items)
  }

  return results
}

// This example is stats-only, doesn't take limits into account

const submissions = await fetchToLimits(ADDRESS)

const total = submissions.reduce((acc, item) => acc.plus(item.amount), Big(0))

const uniqueReferred = [...new Set(submissions.map((x) => x.sender))]

console.log(
  ADDRESS,
  'referred a total of',
  total.div('1e18').round(2).toNumber(),
  'stETH'
)
console.log(ADDRESS, 'referred', uniqueReferred.length, 'unique addresses')
