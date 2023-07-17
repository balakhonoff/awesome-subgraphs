import { DEPOSIT_AMOUNT, ETHER, ONE } from '../src/constants'
import {
  describe,
  test,
  clearStore,
  newMockEvent,
  afterEach,
  beforeEach,
  assert,
} from 'matchstick-as/assembly/index'
import { Totals, CurrentFees, OracleCompleted } from '../generated/schema'
import { Completed } from '../generated/LidoOracle/LidoOracle'
import { BigInt, Address, ethereum } from '@graphprotocol/graph-ts'
import { handleCompleted } from '../src/LidoOracle'

import { createMockedRewardDistribution } from './mockedFns'

const sampleVals = BigInt.fromI32(10)
const someVals = sampleVals.times(DEPOSIT_AMOUNT)
const someRewards = BigInt.fromI32(2).times(ETHER)

const INITIAL_BEACON_BALANCE = someVals.plus(someRewards)
const INITIAL_BEACON_VALIDATORS = sampleVals

function createNewCompletedEvent(
  epochId: string,
  beaconBalance: BigInt,
  beaconValidators: BigInt
): Completed {
  // @ts-ignore this is AssemblyScript
  let event = changetype<Completed>(newMockEvent())

  event.parameters = new Array()
  let epochIdParam = new ethereum.EventParam(
    'epochId',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(epochId))
  )
  let beaconBalanceParam = new ethereum.EventParam(
    'beaconBalance',
    ethereum.Value.fromUnsignedBigInt(beaconBalance)
  )
  let beaconValidatorsParam = new ethereum.EventParam(
    'beaconValidators',
    ethereum.Value.fromUnsignedBigInt(beaconValidators)
  )

  event.parameters.push(epochIdParam)
  event.parameters.push(beaconBalanceParam)
  event.parameters.push(beaconValidatorsParam)

  return event
}

describe('handleCompleted()', () => {
  beforeEach(() => {
    let totals = new Totals('')
    totals.totalPooledEther = INITIAL_BEACON_BALANCE
    totals.totalShares = INITIAL_BEACON_BALANCE
    totals.save()

    let currentFees = new CurrentFees('')
    currentFees.feeBasisPoints = BigInt.fromI32(1000)
    currentFees.insuranceFeeBasisPoints = BigInt.fromI32(0)
    currentFees.operatorsFeeBasisPoints = BigInt.fromI32(5000)
    currentFees.treasuryFeeBasisPoints = BigInt.fromI32(5000)
    currentFees.save()

    let prevDay = new OracleCompleted('0')
    prevDay.epochId = BigInt.fromI32(0)
    prevDay.beaconBalance = INITIAL_BEACON_BALANCE
    prevDay.beaconValidators = INITIAL_BEACON_VALIDATORS
    prevDay.block = BigInt.fromI32(0)
    prevDay.blockTime = BigInt.fromI32(0)
    prevDay.transactionHash = Address.fromHexString(
      '0xde2667f834746bdbe0872163d632ce79c4930a82ec7c3c11cb015373b691643b'
    )
    prevDay.save()
  })

  afterEach(() => {
    clearStore()
  })

  test('positive rewards', () => {
    let newBalance = INITIAL_BEACON_BALANCE.plus(ETHER)
    let newValidators = INITIAL_BEACON_VALIDATORS
    let event = createNewCompletedEvent('1', newBalance, newValidators)

    createMockedRewardDistribution('49860637968411272')
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.plus(ETHER)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('no rewards and val increase', () => {
    let newBalance = INITIAL_BEACON_BALANCE.plus(DEPOSIT_AMOUNT)
    let newValidators = INITIAL_BEACON_VALIDATORS.plus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)

    createMockedRewardDistribution('0')
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('positive rewards with new vals', () => {
    let newBalance =
      INITIAL_BEACON_BALANCE.plus(DEPOSIT_AMOUNT).plus(someRewards)
    let newValidators = INITIAL_BEACON_VALIDATORS.plus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)

    createMockedRewardDistribution('99444101297096973')
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.plus(someRewards)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('negative rewards', () => {
    let newBalance = INITIAL_BEACON_BALANCE.minus(someRewards)
    let newValidators = INITIAL_BEACON_VALIDATORS
    let event = createNewCompletedEvent('1', newBalance, newValidators)

    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.minus(someRewards)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('less vals', () => {
    let newBalance = INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT)
    let newValidators = INITIAL_BEACON_VALIDATORS.minus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('negative rewards with less vals', () => {
    let newBalance =
      INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT).minus(someRewards)
    let newValidators = INITIAL_BEACON_VALIDATORS.minus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)
    handleCompleted(event)

    let expected =
      INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT).minus(someRewards)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('more vals but negative rewards', () => {
    let newBalance =
      INITIAL_BEACON_BALANCE.plus(DEPOSIT_AMOUNT).minus(someRewards)
    let newValidators = INITIAL_BEACON_VALIDATORS.plus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.minus(someRewards)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('less vals but positive rewards', () => {
    let newBalance = INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT)
      .plus(DEPOSIT_AMOUNT)
      .plus(someRewards)
    let newValidators = INITIAL_BEACON_VALIDATORS.minus(ONE)
    let event = createNewCompletedEvent('1', newBalance, newValidators)
    handleCompleted(event)

    let expected = INITIAL_BEACON_BALANCE.minus(DEPOSIT_AMOUNT)
      .plus(DEPOSIT_AMOUNT)
      .plus(someRewards)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })

  test('case block 6014700', () => {
    let totals = new Totals('')
    totals.totalPooledEther = BigInt.fromString('7434367928985000000000')
    totals.totalShares = BigInt.fromString('7434367928985000000000')
    totals.save()

    let prevDay = OracleCompleted.load('0')!
    prevDay.beaconBalance = BigInt.fromString('7434367928985000000000')
    prevDay.beaconValidators = BigInt.fromString('232')
    prevDay.save()

    let newBalance = BigInt.fromString('3967408320298000000000')
    let newValidators = BigInt.fromString('123')
    let event = createNewCompletedEvent('1', newBalance, newValidators)
    handleCompleted(event)

    let delta = newBalance.minus(prevDay.beaconBalance)
    let expected = prevDay.beaconBalance.plus(delta)
    assert.fieldEquals('Totals', '', 'totalPooledEther', expected.toString())
  })
})
