import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import {
  MemberAdded,
  MemberRemoved,
  QuorumChanged,
  Completed,
  ContractVersionSet,
  PostTotalShares,
  BeaconReported,
  BeaconSpecSet,
  ExpectedEpochIdUpdated,
  BeaconReportReceiverSet,
  AllowedBeaconBalanceRelativeDecreaseSet,
  AllowedBeaconBalanceAnnualRelativeIncreaseSet,
} from '../generated/LidoOracle/LidoOracle'
import {
  OracleCompleted,
  OracleMember,
  OracleQuorumChange,
  TotalReward,
  OracleVersion,
  AllowedBeaconBalanceRelativeDecrease,
  AllowedBeaconBalanceAnnualRelativeIncrease,
  OracleExpectedEpoch,
  BeaconReport,
  BeaconSpec,
  BeaconReportReceiver,
  Totals,
  NodeOperatorsShares,
  CurrentFees,
} from '../generated/schema'

import { CALCULATION_UNIT, DEPOSIT_AMOUNT, ZERO, ONE } from './constants'

import { loadNosContract } from './contracts'

import { lastIncrementalId, guessOracleRunsTotal } from './utils'

export function handleCompleted(event: Completed): void {
  let previousCompletedId = lastIncrementalId(
    'OracleCompleted',
    guessOracleRunsTotal(event.block.timestamp)
  )
  let nextCompletedId = BigInt.fromString(previousCompletedId)
    .plus(ONE)
    .toString()

  let previousCompleted = OracleCompleted.load(previousCompletedId)
  let newCompleted = new OracleCompleted(nextCompletedId)

  newCompleted.epochId = event.params.epochId
  newCompleted.beaconBalance = event.params.beaconBalance
  newCompleted.beaconValidators = event.params.beaconValidators

  newCompleted.block = event.block.number
  newCompleted.blockTime = event.block.timestamp
  newCompleted.transactionHash = event.transaction.hash

  newCompleted.save()

  let oldBeaconValidators = previousCompleted
    ? previousCompleted.beaconValidators
    : ZERO

  let oldBeaconBalance = previousCompleted
    ? previousCompleted.beaconBalance
    : ZERO

  let newBeaconValidators = event.params.beaconValidators
  let newBeaconBalance = event.params.beaconBalance

  let appearedValidators = newBeaconValidators.minus(oldBeaconValidators)

  /**
   Appeared validators can be negative if active keys are deleted, which can happen on Testnet.
   As we are comparing previous Oracle report, by the time of a new report validator removal can happen.
   
   In such cases, we override appearedValidatorsDeposits to ZERO as:
   Our Subgraph 10 - 20 = -10 validatorsAmount math is 10 - 10 = 0 validatorsAmount in contract.
   
   Context:
   
   totalPooledEther = bufferedBalance (in the contract) + beaconBalance (validator balances) + transientBalance (sent to validators, but not yet there)
   
   transientBalance is tricky, it's (depositedValidators - beaconValidators) * 32eth
   
   DEPOSITED_VALIDATORS_POSITION is incremented on ETH deposit to deposit contract
   BEACON_VALIDATORS_POSITION is incremented on oracle reports
   
   As we saw on testnet, manual active key removal will adjust totalPooledEther straight away as there will be a difference between validators deposited and beacon validators.
   
   DEPOSITED_VALIDATORS_POSITION was left intact
   BEACON_VALIDATORS_POSITION was decreased
   
   This would increase totalPooledEther until an oracle report is made.
  **/

  let appearedValidatorsDeposits = appearedValidators.gt(ZERO)
    ? appearedValidators.times(DEPOSIT_AMOUNT)
    : ZERO

  let rewardBase = appearedValidatorsDeposits.plus(oldBeaconBalance)

  // Totals are already non-null on first oracle report
  let totals = Totals.load('') as Totals

  // Keeping data before increase
  let totalPooledEtherBefore = totals.totalPooledEther
  let totalSharesBefore = totals.totalShares

  let rewards = newBeaconBalance.minus(rewardBase)

  // Increasing or decreasing totals
  let totalPooledEtherAfter = totals.totalPooledEther.plus(rewards)

  // Don’t mint/distribute any protocol fee on the non-profitable Lido oracle report
  // (when beacon chain balance delta is zero or negative).
  // See ADR #3 for details: https://research.lido.fi/t/rewards-distribution-after-the-merge-architecture-decision-record/1535
  if (newBeaconBalance.le(rewardBase)) {
    totals.totalPooledEther = totalPooledEtherAfter
    totals.save()
    return
  }

  // Create an empty TotalReward entity that will be filled on Transfer events
  // We know that in this transaction there will be Transfer events which we can identify by existence of TotalReward entity with transaction hash as its id
  let totalRewardsEntity = new TotalReward(event.transaction.hash)

  // Saving meta values
  totalRewardsEntity.block = event.block.number
  totalRewardsEntity.blockTime = event.block.timestamp
  totalRewardsEntity.transactionIndex = event.transaction.index
  totalRewardsEntity.logIndex = event.logIndex
  totalRewardsEntity.transactionLogIndex = event.transactionLogIndex

  totalRewardsEntity.totalRewardsWithFees = rewards
  // Setting totalRewards to totalRewardsWithFees so we can subtract fees from it
  totalRewardsEntity.totalRewards = rewards
  // Setting initial 0 values so we can add fees to it
  totalRewardsEntity.totalFee = ZERO
  totalRewardsEntity.operatorsFee = ZERO

  let currentFees = CurrentFees.load('')!

  // Total fee of the protocol eg 1000 / 100 = 10% fee
  let feeBasis = currentFees.feeBasisPoints! // 1000

  // Overall shares for all rewards cut
  let shares2mint = rewards
    .times(feeBasis)
    .times(totals.totalShares)
    .div(
      totalPooledEtherAfter
        .times(CALCULATION_UNIT)
        .minus(feeBasis.times(rewards))
    )

  let totalSharesAfter = totals.totalShares.plus(shares2mint)

  totals.totalPooledEther = totalPooledEtherAfter
  totals.totalShares = totalSharesAfter
  totals.save()

  // Further shares calculations
  // There are currently 3 possible fees
  let treasuryFeeBasisPoints = currentFees.treasuryFeeBasisPoints! // 0
  let insuranceFeeBasisPoints = currentFees.insuranceFeeBasisPoints! // 5000
  let operatorsFeeBasisPoints = currentFees.operatorsFeeBasisPoints! // 5000

  // Storing contract calls data so we don't need to fetch it again
  // We will load them in handleMevTxFeeReceived in Lido handlers
  totalRewardsEntity.feeBasis = feeBasis
  totalRewardsEntity.treasuryFeeBasisPoints = treasuryFeeBasisPoints
  totalRewardsEntity.insuranceFeeBasisPoints = insuranceFeeBasisPoints
  totalRewardsEntity.operatorsFeeBasisPoints = operatorsFeeBasisPoints

  let sharesToInsuranceFund = shares2mint
    .times(insuranceFeeBasisPoints)
    .div(CALCULATION_UNIT)

  let sharesToOperators = shares2mint
    .times(operatorsFeeBasisPoints)
    .div(CALCULATION_UNIT)

  totalRewardsEntity.shares2mint = shares2mint

  totalRewardsEntity.sharesToInsuranceFund = sharesToInsuranceFund
  totalRewardsEntity.sharesToOperators = sharesToOperators

  totalRewardsEntity.totalPooledEtherBefore = totalPooledEtherBefore
  totalRewardsEntity.totalPooledEtherAfter = totalPooledEtherAfter
  totalRewardsEntity.totalSharesBefore = totalSharesBefore
  totalRewardsEntity.totalSharesAfter = totalSharesAfter

  // We will save the entity later

  let registry = loadNosContract()
  let distr = registry.getRewardsDistribution(sharesToOperators)

  let opAddresses = distr.value0
  let opShares = distr.value1

  let sharesToOperatorsActual = ZERO

  for (let i = 0; i < opAddresses.length; i++) {
    let addr = opAddresses[i]
    let shares = opShares[i]

    // Incrementing total of actual shares distributed
    sharesToOperatorsActual = sharesToOperatorsActual.plus(shares)

    let nodeOperatorsShares = new NodeOperatorsShares(
      event.transaction.hash.toHex() + '-' + addr.toHexString()
    )
    nodeOperatorsShares.totalReward = event.transaction.hash

    nodeOperatorsShares.address = addr
    nodeOperatorsShares.shares = shares

    nodeOperatorsShares.save()
  }

  // sharesToTreasury either:
  // - contain dust already and dustSharesToTreasury is 0
  // or
  // - 0 and there's dust

  let treasuryShares = shares2mint
    .minus(sharesToInsuranceFund)
    .minus(sharesToOperatorsActual)

  let sharesToTreasury = treasuryFeeBasisPoints.notEqual(ZERO)
    ? treasuryShares
    : ZERO
  totalRewardsEntity.sharesToTreasury = sharesToTreasury

  let dustSharesToTreasury = treasuryFeeBasisPoints.equals(ZERO)
    ? treasuryShares
    : ZERO
  totalRewardsEntity.dustSharesToTreasury = dustSharesToTreasury

  // Calculating APR
  // Can be overridden by handlePostTotalShares

  let aprRaw = totalPooledEtherAfter
    .toBigDecimal()
    .div(totalPooledEtherBefore.toBigDecimal())
    .minus(BigInt.fromI32(1).toBigDecimal())
    .times(BigInt.fromI32(100).toBigDecimal())
    .times(BigInt.fromI32(365).toBigDecimal())

  totalRewardsEntity.aprRaw = aprRaw

  // Time-compensated APR
  // (postTotalPooledEther - preTotalPooledEther) * secondsInYear / (preTotalPooledEther * timeElapsed)

  let aprBeforeFees: BigDecimal | null = null

  if (previousCompleted) {
    let secondsInYear = BigInt.fromI32(60 * 60 * 24 * 365)
    let timeElapsed = newCompleted.blockTime.minus(previousCompleted.blockTime)

    aprBeforeFees = totalPooledEtherAfter
      .minus(totalPooledEtherBefore)
      .times(secondsInYear)
      .toBigDecimal()
      .div(totalPooledEtherBefore.times(timeElapsed).toBigDecimal())
      .times(BigInt.fromI32(100).toBigDecimal())

    totalRewardsEntity.aprBeforeFees = aprBeforeFees
  }

  // Subtracting fees
  // Fallback time-adjusted values to no adjustments if this is the first report
  let feeSubtractionBase = aprBeforeFees ? aprBeforeFees : aprRaw

  let apr = feeSubtractionBase.minus(
    feeSubtractionBase
      .times(CALCULATION_UNIT.toBigDecimal())
      .div(feeBasis.toBigDecimal())
      .div(BigInt.fromI32(100).toBigDecimal())
  )

  totalRewardsEntity.apr = apr
  totalRewardsEntity.save()
}

export function handleMemberAdded(event: MemberAdded): void {
  let entity = new OracleMember(event.params.member)

  entity.member = event.params.member
  entity.removed = false

  entity.save()
}

export function handleMemberRemoved(event: MemberRemoved): void {
  let entity = OracleMember.load(event.params.member)

  if (entity == null) {
    entity = new OracleMember(event.params.member)
  }

  entity.removed = true

  entity.save()
}

export function handleQuorumChanged(event: QuorumChanged): void {
  let entity = new OracleQuorumChange(
    event.transaction.hash.toHex() + event.logIndex.toString()
  )

  entity.quorum = event.params.quorum

  entity.save()
}

export function handleContractVersionSet(event: ContractVersionSet): void {
  let entity = new OracleVersion(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.version = event.params.version

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp

  entity.save()
}

export function handlePostTotalShares(event: PostTotalShares): void {
  let entity = TotalReward.load(event.transaction.hash)

  if (!entity) {
    return
  }

  let preTotalPooledEther = event.params.preTotalPooledEther
  let postTotalPooledEther = event.params.postTotalPooledEther
  let timeElapsed = event.params.timeElapsed

  entity.preTotalPooledEther = preTotalPooledEther
  entity.postTotalPooledEther = postTotalPooledEther
  entity.timeElapsed = timeElapsed
  entity.totalShares = event.params.totalShares

  /**
  
  aprRaw -> aprBeforeFees -> apr
  
  aprRaw - APR straight from validator balances without adjustments
  aprBeforeFees - APR compensated for time difference between oracle reports
  apr - Time-compensated APR with fees subtracted
  
  **/

  // APR without subtracting fees and without any compensations

  let aprRaw = postTotalPooledEther
    .toBigDecimal()
    .div(preTotalPooledEther.toBigDecimal())
    .minus(BigInt.fromI32(1).toBigDecimal())
    .times(BigInt.fromI32(100).toBigDecimal())
    .times(BigInt.fromI32(365).toBigDecimal())

  entity.aprRaw = aprRaw

  // Time-compensated APR
  // (postTotalPooledEther - preTotalPooledEther) * secondsInYear / (preTotalPooledEther * timeElapsed)

  let secondsInYear = BigInt.fromI32(60 * 60 * 24 * 365)

  let aprBeforeFees = postTotalPooledEther
    .minus(preTotalPooledEther)
    .times(secondsInYear)
    .toBigDecimal()
    .div(preTotalPooledEther.times(timeElapsed).toBigDecimal())
    .times(BigInt.fromI32(100).toBigDecimal())

  entity.aprBeforeFees = aprBeforeFees

  // Subtracting fees

  let currentFees = CurrentFees.load('')!

  let feeBasis = currentFees.feeBasisPoints!.toBigDecimal() // 1000

  let apr = aprBeforeFees.minus(
    aprBeforeFees
      .times(CALCULATION_UNIT.toBigDecimal())
      .div(feeBasis)
      .div(BigInt.fromI32(100).toBigDecimal())
  )

  entity.apr = apr

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp

  entity.save()
}

export function handleBeaconReported(event: BeaconReported): void {
  let entity = new BeaconReport(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.epochId = event.params.epochId
  entity.beaconBalance = event.params.beaconBalance
  entity.beaconValidators = event.params.beaconValidators
  entity.caller = event.params.caller

  entity.save()
}

export function handleBeaconSpecSet(event: BeaconSpecSet): void {
  let entity = new BeaconSpec(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.epochsPerFrame = event.params.epochsPerFrame
  entity.slotsPerEpoch = event.params.slotsPerEpoch
  entity.secondsPerSlot = event.params.secondsPerSlot
  entity.genesisTime = event.params.genesisTime

  entity.save()
}

export function handleExpectedEpochIdUpdated(
  event: ExpectedEpochIdUpdated
): void {
  let entity = new OracleExpectedEpoch(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.epochId = event.params.epochId

  entity.save()
}

export function handleBeaconReportReceiverSet(
  event: BeaconReportReceiverSet
): void {
  let entity = new BeaconReportReceiver(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.callback = event.params.callback

  entity.save()
}

export function handleAllowedBeaconBalanceRelativeDecreaseSet(
  event: AllowedBeaconBalanceRelativeDecreaseSet
): void {
  let entity = new AllowedBeaconBalanceRelativeDecrease(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.value = event.params.value

  entity.save()
}

export function handleAllowedBeaconBalanceAnnualRelativeIncreaseSet(
  event: AllowedBeaconBalanceAnnualRelativeIncreaseSet
): void {
  let entity = new AllowedBeaconBalanceAnnualRelativeIncrease(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.value = event.params.value

  entity.save()
}
