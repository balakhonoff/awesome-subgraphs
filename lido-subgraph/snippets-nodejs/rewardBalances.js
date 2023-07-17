import { subgraphFetch, gql, Big, lidoFuncCall } from './utils.js'
import { ADDRESS } from './config.js'

const query = gql`
  {
    oracleCompleteds(first: 1000, orderBy: block, orderDirection: asc) {
      block
      blockTime
    }
  }
`

const oracleReports = (await subgraphFetch(query)).oracleCompleteds

// Make sure to use an archive node!
for (let report of oracleReports) {
  const balanceBefore = await lidoFuncCall('balanceOf', ADDRESS, {
    blockTag: parseInt(report.block - 1),
  })
  const balanceAfter = await lidoFuncCall('balanceOf', ADDRESS, {
    blockTag: parseInt(report.block),
  })

  const reward = Big(balanceAfter).minus(balanceBefore)

  console.log(report.block, reward.toString())
}
