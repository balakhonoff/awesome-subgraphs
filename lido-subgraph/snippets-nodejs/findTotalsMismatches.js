import { subgraphFetch, gql, lidoFuncCall, Big } from './utils.js'

const firstSubmitQuery = gql`
  query {
    lidoSubmissions(orderBy: block, orderDirection: asc, limit: 1) {
      block
    }
  }
`

const lastIndexedQuery = gql`
  query {
    _meta {
      block {
        number
      }
    }
  }
`

const genQuery = (block) => gql`
  query {
    totals(id: "", block: { number: ${block} }) {
      totalPooledEther
      totalShares
    }
  }
`

const startBlock = parseInt(
  (await subgraphFetch(firstSubmitQuery)).lidoSubmissions[0].block
)
const endBlock = parseInt(
  (await subgraphFetch(lastIndexedQuery))._meta.block.number
)

let min = startBlock
let max = endBlock

while (min <= max) {
  const mid = Math.floor((min + max) / 2)

  const ethEther = Big(
    await lidoFuncCall('getTotalPooledEther', {
      blockTag: mid,
    })
  )
  const ethShares = Big(
    await lidoFuncCall('getTotalShares', {
      blockTag: mid,
    })
  )

  const subgraphData = await subgraphFetch(genQuery(mid))
  const subEther = Big(subgraphData.totals.totalPooledEther)
  const subShares = Big(subgraphData.totals.totalShares)

  const isGood = ethEther.eq(subEther) && ethShares.eq(subShares)

  if (isGood) {
    // Check doesn't fail yet, going up
    min = mid + 1
  } else {
    // Check already fails, need to go down
    max = mid
  }

  if (min === max && !isGood) {
    // Found it
    if (!ethEther.eq(subEther)) {
      console.log(
        'Ether mismatch @',
        mid,
        ethEther.toString(),
        '<->',
        subEther.toString()
      )
    }
    if (!ethShares.eq(subShares)) {
      console.log(
        'Shares mismatch @',
        mid,
        ethShares.toString(),
        '<->',
        subShares.toString()
      )
    }
    process.exit()
  }
}

console.log('No mismatches found!')
