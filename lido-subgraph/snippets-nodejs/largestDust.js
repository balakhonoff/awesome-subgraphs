import { subgraphFetch, gql, Big } from './utils.js'

const query = gql`
  {
    totalRewards(first: 1000) {
      dust
    }
  }
`

const totalRewards = (await subgraphFetch(query)).totalRewards

let largestDust = Big(0)

for (let report of totalRewards) {
  const dust = Big(report.dust)

  if (dust.gt(largestDust)) {
    largestDust = dust
  }
}

console.log('Largest dust:', largestDust.toString())
