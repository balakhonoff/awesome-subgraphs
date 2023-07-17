import { subgraphFetch, gql, lidoFuncCall, Big } from './utils.js'

const TREASURY_ADDRESS = '0x3e40d73eb977dc6a537af587d48316fee66e9c8c'

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

const startBlock = parseInt(
  (await subgraphFetch(firstSubmitQuery)).lidoSubmissions[0].block
)
const endBlock = parseInt(
  (await subgraphFetch(lastIndexedQuery))._meta.block.number
)

let min = startBlock
let max = endBlock

const genQuery = (block) => gql`
  query {
    shares(id: "${TREASURY_ADDRESS}", block: { number: ${block} }) {
      shares
    }
  }
`

while (min <= max) {
  const mid = Math.floor((min + max) / 2)

  const ethShares = Big(
    await lidoFuncCall('sharesOf', TREASURY_ADDRESS, {
      blockTag: mid,
    })
  )

  const subgraphData = await subgraphFetch(genQuery(mid))
  const subShares = Big(subgraphData.shares.shares)

  const isGood = ethShares.eq(subShares)

  if (isGood) {
    // Check doesn't fail yet, going up
    min = mid + 1
  } else {
    // Check already fails, need to go down
    max = mid
  }

  if (min === max && !isGood) {
    // Found it
    if (!ethShares.eq(subShares)) {
      console.log(
        'Mismatch @',
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
