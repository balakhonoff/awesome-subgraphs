import json
from datetime import datetime

from web3 import Web3

from gql import gql, Client
from gql.transport.requests import RequestsHTTPTransport

subgraph_url = "https://api.thegraph.com/subgraphs/name/lidofinance/lido"

lido_address = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
lido_abi = json.load(open("../abis/Lido.json"))

w3 = Web3(Web3.HTTPProvider("RPC_PROVIDER_HERE"))
lido_contract = w3.eth.contract(address=lido_address, abi=lido_abi)

address_to_check = Web3.toChecksumAddress("ADDRESS_TO_CHECK_HERE")
balance_function = lido_contract.functions.balanceOf(address_to_check)


graphql_transport = RequestsHTTPTransport(
    url=subgraph_url,
    use_json=True,
    headers={
        "Content-type": "application/json",
    },
    verify=False,
    retries=3,
)

graphql_client = Client(
    transport=graphql_transport,
    fetch_schema_from_transport=True,
)

query = gql(
    """
query {
    oracleCompleteds (first: 1000, orderBy: block, orderDirection: desc) {
        block
        blockTime
  }
}
"""
)

reports = graphql_client.execute(query)

for report in reports["oracleCompleteds"]:
    gwei_balance = balance_function.call(block_identifier=int(report["block"]))
    eth_balance = Web3.fromWei(gwei_balance, "ether")
    time = datetime.utcfromtimestamp(int(report["blockTime"])).strftime("%Y-%m-%d %H:%M:%S")

    print(time, eth_balance)
