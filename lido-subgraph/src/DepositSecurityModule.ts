import {
  DepositsPaused,
  DepositsUnpaused,
  GuardianAdded,
  GuardianQuorumChanged,
  GuardianRemoved,
  MaxDepositsChanged,
  MinDepositBlockDistanceChanged,
  NodeOperatorsRegistryChanged,
  OwnerChanged,
  PauseIntentValidityPeriodBlocksChanged,
} from '../generated/DepositSecurityModule/DepositSecurityModule'

import {
  DepositSecurityModuleSettings,
  DepositsPause,
  DepositsUnpause,
  Guardian,
  GuardianQuorumChange,
  MaxDepositsChange,
  MinDepositBlockDistanceChange,
  NodeOperatorsRegistryChange,
  OwnerChange,
  PauseIntentValidityPeriodBlocksChange,
} from '../generated/schema'

function loadConfig(): DepositSecurityModuleSettings {
  let entity = DepositSecurityModuleSettings.load('')
  if (!entity) entity = new DepositSecurityModuleSettings('')
  return entity
}

export function handleDepositsPaused(event: DepositsPaused): void {
  let entity = new DepositsPause(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.guardian = event.params.guardian.toHexString()

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.paused = true
  config.save()
}

export function handleDepositsUnpaused(event: DepositsUnpaused): void {
  let entity = new DepositsUnpause(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.paused = false
  config.save()
}

export function handleGuardianAdded(event: GuardianAdded): void {
  let entity = new Guardian(event.params.guardian.toHexString())

  entity.address = event.params.guardian

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.removed = false

  entity.save()
}

export function handleGuardianQuorumChanged(
  event: GuardianQuorumChanged
): void {
  let newValue = event.params.newValue

  let entity = new GuardianQuorumChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.guardianQuorum = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.guardianQuorum = newValue
  config.save()
}

export function handleGuardianRemoved(event: GuardianRemoved): void {
  let entity = Guardian.load(event.params.guardian.toHexString())

  // Do we have this guardian?
  if (entity) {
    entity.removed = true
    entity.save()
  }
}

export function handleMaxDepositsChanged(event: MaxDepositsChanged): void {
  let newValue = event.params.newValue

  let entity = new MaxDepositsChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.maxDeposits = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.maxDeposits = newValue
  config.save()
}

export function handleMinDepositBlockDistanceChanged(
  event: MinDepositBlockDistanceChanged
): void {
  let newValue = event.params.newValue

  let entity = new MinDepositBlockDistanceChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.minDepositBlockDistance = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.minDepositBlockDistance = newValue
  config.save()
}

export function handleNodeOperatorsRegistryChanged(
  event: NodeOperatorsRegistryChanged
): void {
  let newValue = event.params.newValue

  let entity = new NodeOperatorsRegistryChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.nodeOperatorsRegistry = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.nodeOperatorsRegistry = newValue
  config.save()
}

export function handleOwnerChanged(event: OwnerChanged): void {
  let newValue = event.params.newValue

  let entity = new OwnerChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.owner = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.owner = newValue
  config.save()
}

export function handlePauseIntentValidityPeriodBlocksChanged(
  event: PauseIntentValidityPeriodBlocksChanged
): void {
  let newValue = event.params.newValue

  let entity = new PauseIntentValidityPeriodBlocksChange(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.pauseIntentValidityPeriodBlocks = newValue

  entity.block = event.block.number
  entity.blockTime = event.block.timestamp
  entity.transactionHash = event.block.hash

  entity.save()

  let config = loadConfig()
  config.pauseIntentValidityPeriodBlocks = newValue
  config.save()
}
