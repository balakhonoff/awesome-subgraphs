import {
  Contract, Transfer as TransferEvent
} from "../generated/Contract/Contract"
import {
  Balance
} from "../generated/schema"
import { Address, BigInt, log, Bytes } from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {

  let entity = Balance.load(Bytes.fromHexString("0xF977814e90dA44bFA03b6295A0616a897441aceC"));
  if (entity == null) {
    createBalance("0xF977814e90dA44bFA03b6295A0616a897441aceC", event)
    createBalance("0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503", event)
    createBalance("0xA7A93fd0a276fc1C0197a5B5623eD117786eeD06", event)
    createBalance("0x5a52E96BAcdaBb82fd05763E25335261B270Efcb", event)
    createBalance("0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf", event)
    createBalance("0xD6216fC19DB775Df9774a6E33526131dA7D19a2c", event)
    createBalance("0xcEe284F754E854890e311e3280b767F80797180d", event)
    createBalance("0x5754284f345afc66a98fbB0a0Afe71e0F007B949", event)
    createBalance("0x28C6c06298d514Db089934071355E5743bf21d60", event)
    createBalance("0x3CC936b795A188F0e246cBB2D74C5Bd190aeCF18", event)
    createBalance("0xc5451b523d5FFfe1351337a221688a62806ad91a", event)
    createBalance("0x6Fb624B48d9299674022a23d92515e76Ba880113", event)
    createBalance("0x461249076B88189f8AC9418De28B365859E46BfD", event)
    createBalance("0xc708A1c712bA26DC618f972ad7A187F76C8596Fd", event)
    createBalance("0x69a722f0B5Da3aF02b4a205D6F0c285F4ed8F396", event)
    createBalance("0x42436286A9c8d63AAfC2eEbBCA193064d68068f2", event)
    createBalance("0xCbA38020cd7B6F51Df6AFaf507685aDd148F6ab6", event)
    createBalance("0x89e51fA8CA5D66cd220bAed62ED01e8951aa7c40", event)
    createBalance("0xB9711550ec6Dc977f26B73809A2D6791c0F0E9C8", event)
    createBalance("0x65A0947BA5175359Bb457D3b34491eDf4cBF7997", event)
    createBalance("0xe9172Daf64b05B26eb18f07aC8d6D723aCB48f99", event)
    createBalance("0xf59869753f41Db720127Ceb8DbB8afAF89030De4", event)
    createBalance("0x4D19C0a5357bC48be0017095d3C871D9aFC3F21d", event)
    createBalance("0x5C52cC7c96bDE8594e5B77D5b76d042CB5FaE5f2", event)
    createBalance("0x0D0707963952f2fBA59dD06f2b425ace40b492Fe", event)

  }

  updateBalanceFrom(event)
  updateBalanceTo(event)

}

export function updateBalanceFrom(event: TransferEvent): void {
  let entityId = event.params.from;
  let entity = Balance.load(entityId);
  if (entity == null) {
    entity = new Balance(entityId);
  }
  let contract = Contract.bind(event.address);

  // entity.value = contract.balanceOf(event.params.from);


  let balanceResult = contract.try_balanceOf(event.params.from);
  if (!balanceResult.reverted) {
    entity.value = balanceResult.value;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
  }

}
export function updateBalanceTo(event: TransferEvent): void {
  let entityId = event.params.to;
  let entity = Balance.load(entityId);
  if (entity == null) {
    entity = new Balance(entityId);
  }
  let contract = Contract.bind(event.address);

  // entity.value = contract.balanceOf(event.params.to);

  let balanceResult = contract.try_balanceOf(event.params.to);
  if (!balanceResult.reverted) {
    entity.value = balanceResult.value;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;
    entity.save();
  }

}


export function createBalance(address: string, event: TransferEvent): void {
  let entity = new Balance(Bytes.fromHexString(address));
  let contract = Contract.bind(event.address);

  entity.value = contract.balanceOf(Address.fromString(address))
  // entity.value = contract.balanceOf(Address.fromString("0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf"))
  entity.blockNumber = BigInt.fromI32(0); // Set the desired block number
  entity.blockTimestamp = BigInt.fromI32(0); // Set the desired block timestamp
  entity.transactionHash = Bytes.fromHexString("0x"); // Set the desired transaction hash

  entity.save();
}
