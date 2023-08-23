import {
  OwnershipTransferred as OwnershipTransferredEvent,
  Trade as TradeEvent
} from "../generated/FriendtechSharesV1/FriendtechSharesV1"
import { OwnershipTransferred, Trade } from "../generated/schema"

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTrade(event: TradeEvent): void {
  let entity = new Trade(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.trader = event.params.trader
  entity.subject = event.params.subject
  entity.isBuy = event.params.isBuy
  entity.shareAmount = event.params.shareAmount
  entity.ethAmount = event.params.ethAmount
  entity.protocolEthAmount = event.params.protocolEthAmount
  entity.subjectEthAmount = event.params.subjectEthAmount
  entity.supply = event.params.supply

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
