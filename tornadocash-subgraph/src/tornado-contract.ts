import {
  Deposit as DepositEvent,
  Withdrawal as WithdrawalEvent
} from "../generated/TornadoContract/TornadoContract"
import { Deposit, Withdrawal } from "../generated/schema"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { TornadoContract } from "../generated/TornadoContract/TornadoContract"

export function handleDeposit(event: DepositEvent): void {
  let entity = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )

  entity.commitment = event.params.commitment
  entity.leafIndex = event.params.leafIndex
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  // The address that triggered the event can be accessed via event.transaction.from
  entity.from_ = event.transaction.from

  // The value of the transaction in Wei can be accessed via event.transaction.value
  entity.value_ = event.transaction.value

  entity.save()
}

export function handleWithdrawal(event: WithdrawalEvent): void {
  let entity = new Withdrawal(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.to = event.params.to
  entity.nullifierHash = event.params.nullifierHash
  entity.relayer = event.params.relayer
  entity.fee = event.params.fee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
