# Totals Spec

## Intro

For contracts with shares-based balances, there is only one way to calculate user’s balance with perfect accuracy.

1. Know how many shares address holds
2. Know total ETH Lido controls
3. Know total shares in Lido

Then we use this formula:

```javascript
sharesAmount.mul(TotalPooledEther).div(totalShares)
```

Rewards for an address each rebase are simply:

```javascript
balanceAfterRewards.minus(balanceBeforeRewards)
```

[balanceOf() Source](https://github.com/lidofinance/lido-dao/blob/816bf1d0995ba5cfdfc264de4acda34a7fe93eba/contracts/0.4.24/StETH.sol#L125-L133)
[getSharesByPooledEth() Source](https://github.com/lidofinance/lido-dao/blob/816bf1d0995ba5cfdfc264de4acda34a7fe93eba/contracts/0.4.24/StETH.sol#L266-L278)

## Indexing

We need to parse two types of events:

1. Events affecting system variables so we can calculate balances at any time with 100% accuracy
2. Transfer and Submitted events to track share balances of addresses

Store system totals:

- totalPooledEther - total ETH Lido controls
- totalShares - total shares Lido controls

During indexing we:

- Increase totalPooledEther and totalShares on mint by holders (stakings) using Submitted events
- Increase totalPooledEther and totalShares on mint of rewards including reward commissions using Oracle’s Completed events

To easily query balances, we store a Shares entity for every stETH holder (address-shares).

It is necessary to test global variables. We simply compare Subgraph’s values with responses from view functions of the contract.

Note:
It is vital to do calculations as they are done in Solidity: Rounding numbers towards zero when doing division.

## Oracle Contract

Events:

- Completed

### Completed

First, load last Completed entity and create a new one:

```javascript
let previousCompleted = OracleCompleted.load(
  lastIncrementalId(
    'OracleCompleted',
    guessOracleRunsTotal(event.block.timestamp)
  )
)

let newCompleted = new OracleCompleted(
  nextIncrementalId(
    'OracleCompleted',
    guessOracleRunsTotal(event.block.timestamp)
  )
)
newCompleted.epochId = event.params.epochId
newCompleted.beaconBalance = event.params.beaconBalance
newCompleted.beaconValidators = event.params.beaconValidators

newCompleted.block = event.block.number
newCompleted.blockTime = event.block.timestamp
newCompleted.transactionHash = event.transaction.hash

newCompleted.save()
```

Create TotalRewards entity which we will fill half here and half catching Transfer events in the Lido contract:

```javascript
// Create an empty TotalReward entity that will be filled on Transfer events
// We know that in this transaction there will be Transfer events which we can identify by existence of TotalReward entity with transaction hash as its id
let totalRewardsEntity = new TotalReward(event.transaction.hash.toHex())

totalRewardsEntity.block = event.block.number
totalRewardsEntity.blockTime = event.block.timestamp
totalRewardsEntity.transactionIndex = event.transaction.index
totalRewardsEntity.logIndex = event.logIndex
totalRewardsEntity.transactionLogIndex = event.transactionLogIndex
```

Calculating raw rewards (positive validator balance changes). For every new validator appearing, we need to compensate that new 32 eth balance is for activation, not rewards:

```javascript
let oldBeaconValidators = previousCompleted
  ? previousCompleted.beaconValidators
  : ZERO

let oldBeaconBalance = previousCompleted
  ? previousCompleted.beaconBalance
  : ZERO

let newBeaconValidators = event.params.beaconValidators
let newBeaconBalance = event.params.beaconBalance

// TODO: Can appearedValidators be negative? If eg active keys are deleted for some reason
let appearedValidators = newBeaconValidators.minus(oldBeaconValidators)
let appearedValidatorsDeposits = appearedValidators.times(DEPOSIT_AMOUNT)
let rewardBase = appearedValidatorsDeposits.plus(oldBeaconBalance)
let newTotalRewards = newBeaconBalance.minus(rewardBase)

let positiveRewards = newTotalRewards.gt(ZERO)

totalRewardsEntity.totalRewardsWithFees = newTotalRewards
```

Set initial values which we will increase or decrease when handling Transfer events:

```javascript
// Setting totalRewards to totalRewardsWithFees so we can subtract fees from it
totalRewardsEntity.totalRewards = newTotalRewards
// Setting initial 0 value so we can add fees to it
totalRewardsEntity.totalFee = ZERO
```

Adjusting totals and calculating shares that were minted:

```javascript
  // Totals and rewards data logic
  // Totals are already non-null on first oracle report
  let totals = Totals.load('') as Totals

  // Keeping data before increase
  let totalPooledEtherBefore = totals.totalPooledEther
  let totalSharesBefore = totals.totalShares

  let feeBasis = BigInt.fromI32(contract.getFee()) // 1000

  // Increasing or decreasing totals
  let totalPooledEtherAfter = positiveRewards
	? totals.totalPooledEther.plus(newTotalRewards)
	: totals.totalPooledEther.minus(newTotalRewards.abs())

  // Overall shares for all rewards cut
  let shares2mint = positiveRewards
	? newTotalRewards
		.times(feeBasis)
		.times(totals.totalShares)
		.div(
		  totalPooledEtherAfter
			.times(CALCULATION_UNIT)
			.minus(feeBasis.times(newTotalRewards))
		)
	: ZERO

  let totalSharesAfter = totals.totalShares.plus(shares2mint)

  totals.totalPooledEther = totalPooledEtherAfter
  totals.totalShares = totalSharesAfter
  totals.save()
```

Calculating in detail how shares were distributed:

```javascript
// Further shares calculations
let feeDistribution = contract.getFeeDistribution()
let insuranceFeeBasisPoints = BigInt.fromI32(feeDistribution.value1) // 5000
let operatorsFeeBasisPoints = BigInt.fromI32(feeDistribution.value2) // 5000

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
```

How shares got distributed between node operators:

```javascript
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
  nodeOperatorsShares.totalReward = event.transaction.hash.toHex()

  nodeOperatorsShares.address = addr
  nodeOperatorsShares.shares = shares

  nodeOperatorsShares.save()
}
```

Finally, handling dust (rounding leftovers). SharesToInsuranceFund are exact, but sharesToOperators are with leftovers which we need to account for:

```javascript
let sharesToTreasury = shares2mint
  .minus(sharesToInsuranceFund)
  .minus(sharesToOperatorsActual)

totalRewardsEntity.sharesToTreasury = sharesToTreasury

totalRewardsEntity.save()
```

[Source](https://github.com/lidofinance/lido-subgraph/blob/d90f125772d5cc963816bb3bc3a299a382161d78/src/LidoOracle.ts#L42-L199)

## Lido Contract

Events:

- Transfer
- Submitted

After merge, Withdrawal also needs to be tracked.

### Transfer

#### Part 1

First, identify if this transaction includes rewards distribution. As we save TotalRewards with transaction hash as id, we can simply do:

```javascript
let totalRewardsEntity = TotalReward.load(event.transaction.hash.toHex())

// We know that for rewards distribution shares are minted with same from 0x0 address as staking
// We can save this indicator which helps us distinguish such mints from staking events
entity.mintWithoutSubmission = totalRewardsEntity ? true : false
```

We can easily identify mints:

```javascript
let fromZeros =
  event.params.from ==
  Address.fromString('0x0000000000000000000000000000000000000000')
```

Due to event data limitations, for stakings we can only get correct shares using Submitted event’s Amount, so we will skip it here if we identify staking using our fromZeros helper:

```javascript
  // Entity is already created at this point
  let totals = Totals.load('') as Totals

  entity.totalPooledEther = totals.totalPooledEther
  entity.totalShares = totals.totalShares

  let shares = event.params.value
	.times(totals.totalShares)
	.div(totals.totalPooledEther)

  if (!fromZeros) {
	entity.shares = shares
  }
```

#### Part 2

If there is reward distribution in this transaction (totalRewardsEntity exists), we should record all transfers and save them to totalRewardsEntity.

Helpers:

```javascript
let isFeeDistributionToTreasury =
  fromZeros && event.params.to == getAddress('Treasury')

// graph-ts less or equal to
let isDust = event.params.value.lt(DUST_BOUNDARY)
```

Saving fee transfer to treasury:

```javascript
if (totalRewardsEntity && isFeeDistributionToTreasury && !isDust) {
  // Handling the Insurance Fee transfer event to treasury

  entity.shares = totalRewardsEntity.sharesToInsuranceFund

  totalRewardsEntity.insuranceFee = event.params.value

  totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
    event.params.value
  )
  totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
    event.params.value
  )

  totalRewardsEntity.save()
}
```

Saving dust(calculation leftovers):

```javascript
else if (totalRewardsEntity && isFeeDistributionToTreasury && isDust) {
	// Handling dust transfer event

	entity.shares = totalRewardsEntity.sharesToTreasury

	totalRewardsEntity.dust = event.params.value

	totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
	  event.params.value
	)
	totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
	  event.params.value
	)

	totalRewardsEntity.save()
  }
```

Saving node operator fee transfers:

```javascript
else if (totalRewardsEntity && fromZeros) {
	// Handling node operator fee transfer to node operator

	// Entity should be existent at this point
	let nodeOperatorsShares = NodeOperatorsShares.load(
	  event.transaction.hash.toHex() + '-' + event.params.to.toHexString()
	) as NodeOperatorsShares

	let sharesToOperator = nodeOperatorsShares.shares

	entity.shares = sharesToOperator

	let nodeOperatorFees = new NodeOperatorFees(
	  event.transaction.hash.toHex() + '-' + event.logIndex.toString()
	)

	// Reference to TotalReward entity
	nodeOperatorFees.totalReward = event.transaction.hash.toHex()

	nodeOperatorFees.address = event.params.to
	nodeOperatorFees.fee = event.params.value

	totalRewardsEntity.totalRewards = totalRewardsEntity.totalRewards.minus(
	  event.params.value
	)
	totalRewardsEntity.totalFee = totalRewardsEntity.totalFee.plus(
	  event.params.value
	)

	totalRewardsEntity.save()
	nodeOperatorFees.save()
  }
```

#### Part 3

Finally, adjust sender and recipient share amounts and save balances in the entity.

```javascript
if (entity.shares) {
	// Decreasing from address shares
	// No point in changing 0x0 shares
	if (!fromZeros) {
	  let sharesFromEntity = Shares.load(event.params.from.toHexString())
	  // Address must already have shares, HOWEVER:
	  // Someone can and managed to produce events of 0 to 0 transfers
	  if (!sharesFromEntity) {
		sharesFromEntity = new Shares(event.params.from.toHexString())
		sharesFromEntity.shares = ZERO
	  }

	  entity.sharesBeforeDecrease = sharesFromEntity.shares
	  sharesFromEntity.shares = sharesFromEntity.shares.minus(entity.shares!)
	  entity.sharesAfterDecrease = sharesFromEntity.shares

	  sharesFromEntity.save()

	  // Calculating new balance
	  entity.balanceAfterDecrease = entity
		.sharesAfterDecrease!.times(totals.totalPooledEther)
		.div(totals.totalShares)
	}

	// Increasing to address shares
	let sharesToEntity = Shares.load(event.params.to.toHexString())

	if (!sharesToEntity) {
	  sharesToEntity = new Shares(event.params.to.toHexString())
	  sharesToEntity.shares = ZERO
	}

	entity.sharesBeforeIncrease = sharesToEntity.shares
	sharesToEntity.shares = sharesToEntity.shares.plus(entity.shares!)
	entity.sharesAfterIncrease = sharesToEntity.shares

	sharesToEntity.save()

	// Calculating new balance
	entity.balanceAfterIncrease = entity
	  .sharesAfterIncrease!.times(totals.totalPooledEther)
	  .div(totals.totalShares)
  }
```

[Source](https://github.com/lidofinance/lido-subgraph/blob/d90f125772d5cc963816bb3bc3a299a382161d78/src/Lido.ts#L60-L227)

### Submitted

If Totals vars do not yet exist, create them.

```javascript
// Loading totals
let totals = Totals.load('')

let isFirstSubmission = !totals

if (!totals) {
  totals = new Totals('')
  totals.totalPooledEther = ZERO
  totals.totalShares = ZERO
}
```

If Totals vars do not yet exist, shares = amount in the event because ratio is 1-1 before the first mint.

```javascript
// At deployment ratio is 1:1
let shares = !isFirstSubmission
  ? event.params.amount.times(totals.totalShares).div(totals.totalPooledEther)
  : event.params.amount
entity.shares = shares
```

If Shares entity doesn’t yet exist for this address, create it with id `event.params.sender`. Increment holder’s Shares. Beneficial to also store sharesBefore and sharesAfter.

```javascript
// Increasing address shares
let sharesEntity = Shares.load(event.params.sender.toHexString())

if (!sharesEntity) {
  sharesEntity = new Shares(event.params.sender.toHexString())
  sharesEntity.shares = ZERO
}

entity.sharesBefore = sharesEntity.shares
sharesEntity.shares = sharesEntity.shares.plus(shares)
entity.sharesAfter = sharesEntity.shares
```

Increase totals.

```javascript
// Increasing Totals
totals.totalPooledEther = totals.totalPooledEther.plus(event.params.amount)
totals.totalShares = totals.totalShares.plus(shares)

entity.totalPooledEtherAfter = totals.totalPooledEther
entity.totalSharesAfter = totals.totalShares
```

As we already have needed data, can also include user’s new balance.

```javascript
// Calculating new balance
entity.balanceAfter = entity.sharesAfter
  .times(totals.totalPooledEther)
  .div(totals.totalShares)
```

[Source](https://github.com/lidofinance/lido-subgraph/blob/d90f125772d5cc963816bb3bc3a299a382161d78/src/Lido.ts#L296-L359)

## Sample Schema

```graphql
type LidoTransfer @entity {
  id: ID!

  from: Bytes!
  to: Bytes!
  value: BigInt!

  shares: BigInt
  sharesBeforeDecrease: BigInt
  sharesAfterDecrease: BigInt
  sharesBeforeIncrease: BigInt
  sharesAfterIncrease: BigInt

  mintWithoutSubmission: Boolean!

  totalPooledEther: BigInt!
  totalShares: BigInt!

  balanceAfterDecrease: BigInt
  balanceAfterIncrease: BigInt

  block: BigInt!
  blockTime: BigInt!
  transactionHash: Bytes!
  transactionIndex: BigInt!
  logIndex: BigInt!
  transactionLogIndex: BigInt!
}
```

```graphql
type LidoSubmission @entity {
  id: ID!

  sender: Bytes!
  amount: BigInt!
  referral: Bytes!

  shares: BigInt!
  sharesBefore: BigInt!
  sharesAfter: BigInt!

  totalPooledEtherBefore: BigInt!
  totalPooledEtherAfter: BigInt!
  totalSharesBefore: BigInt!
  totalSharesAfter: BigInt!

  balanceAfter: BigInt!

  block: BigInt!
  blockTime: BigInt!
  transactionHash: Bytes!
  transactionIndex: BigInt!
  logIndex: BigInt!
  transactionLogIndex: BigInt!
}
```

```graphql
type Totals @entity {
  id: ID!

  totalPooledEther: BigInt!
  totalShares: BigInt!
}
```

```graphql
type Shares @entity {
  id: ID!

  shares: BigInt!
}
```

```graphql
type OracleCompleted @entity {
  id: ID!

  epochId: BigInt!
  beaconBalance: BigInt!
  beaconValidators: BigInt!

  block: BigInt!
  blockTime: BigInt!
  transactionHash: Bytes!
}
```

```graphql
type TotalReward @entity {
  id: ID!

  totalRewards: BigInt!
  totalRewardsWithFees: BigInt!

  totalFee: BigInt!
  nodeOperatorFees: [NodeOperatorFees!] @derivedFrom(field: "totalReward")
  insuranceFee: BigInt
  treasuryFee: BigInt
  dust: BigInt

  shares2mint: BigInt!

  sharesToInsuranceFund: BigInt!
  sharesToOperators: BigInt!
  sharesToTreasury: BigInt!
  nodeOperatorsShares: [NodeOperatorsShares!] @derivedFrom(field: "totalReward")

  totalPooledEtherBefore: BigInt!
  totalPooledEtherAfter: BigInt!
  totalSharesBefore: BigInt!
  totalSharesAfter: BigInt!

  postTotalPooledEther: BigInt
  preTotalPooledEther: BigInt
  timeElapsed: BigInt
  totalShares: BigInt

  aprBeforeFees: BigDecimal
  apr: BigDecimal

  block: BigInt!
  blockTime: BigInt!
  transactionIndex: BigInt!
  logIndex: BigInt!
  transactionLogIndex: BigInt!
}
```

[Source](https://github.com/lidofinance/lido-subgraph/blob/master/schema.graphql)
