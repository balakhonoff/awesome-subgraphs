import { ethereum } from '@graphprotocol/graph-ts'
import { BigInt, Address } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as/assembly/index'

export function createMockedRewardDistribution(input: string): void {
  let contractAddress = Address.fromString(
    // Mainnet here as our network check is not working in unit tests
    '0x55032650b14df07b85bF18A3a3eC8E0Af2e028d5'
  )

  createMockedFunction(
    contractAddress,
    'getRewardsDistribution',
    'getRewardsDistribution(uint256):(address[],uint256[])'
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(input))])
    .returns([ethereum.Value.fromArray([]), ethereum.Value.fromArray([])])
}

export function createMockedRewardDistributions(inputs: string[]): void {
  for (let i = 0; i < inputs.length; i++) {
    createMockedRewardDistribution(inputs[0])
  }
}
