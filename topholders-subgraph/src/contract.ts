import {
  Transfer as TransferEvent
} from "../generated/Contract/Contract"
import {
 Balance
} from "../generated/schema"
import { BigInt } from '@graphprotocol/graph-ts'

export function handleTransfer(event: TransferEvent): void {
  // Update 'from' balance
  let fromBalance = Balance.load(event.params.from)
  if (fromBalance == null) {
    fromBalance = new Balance(event.params.from)
    fromBalance.value = BigInt.fromI32(0)
  }
  fromBalance.value = fromBalance.value.minus(event.params.value)
  fromBalance.save()

  // Update 'to' balance
  let toBalance = Balance.load(event.params.to)
  if (toBalance == null) {
    toBalance = new Balance(event.params.to)
    toBalance.value = BigInt.fromI32(0)
  }
  toBalance.value = toBalance.value.plus(event.params.value)
  toBalance.save()

}
