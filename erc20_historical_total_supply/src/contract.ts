import {
  Transfer}
from "../generated/Contract/Contract"
import {
  TotalSupply
} from "../generated/schema"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Contract } from "../generated/Contract/Contract" // Import the generated contract

export function handleTransfer(event: Transfer): void {
  let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")
  if (event.params.from.equals(zeroAddress) || event.params.to.equals(zeroAddress)) {

    let totalSupply = new TotalSupply(event.transaction.hash.concatI32(event.logIndex.toI32()))

    let contract = Contract.bind(event.address)
    let totalSupplyResult = contract.try_totalSupply()
    if (!totalSupplyResult.reverted) {
      totalSupply.value = totalSupplyResult.value
      totalSupply.blockNumber = event.block.number
      totalSupply.save()
    }

  }
}
