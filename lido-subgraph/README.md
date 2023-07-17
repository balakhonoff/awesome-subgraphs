# Lido Subgraph

Subgraph to index Lido contracts.

## Live Deployments

### The Graph Network

Explorer page with playground:
https://thegraph.com/explorer/subgraph?id=HXfMc1jPHfFQoccWd7VMv66km75FoxVHDMvsJj5vG5vf

GraphQL API url (API key is needed):
https://gateway.thegraph.com/api/[api-key]/subgraphs/id/HXfMc1jPHfFQoccWd7VMv66km75FoxVHDMvsJj5vG5vf

### The Graph Hosted

#### Mainnet

Explorer page with playground:
https://thegraph.com/legacy-explorer/subgraph/lidofinance/lido

GraphQL API url:
https://api.thegraph.com/subgraphs/name/lidofinance/lido

#### Testnet (Goerli)

Explorer page with playground:
https://thegraph.com/legacy-explorer/subgraph/lidofinance/lido-testnet

GraphQL API url:
https://api.thegraph.com/subgraphs/name/lidofinance/lido-testnet

## Contracts

- Lido
- Lido Oracle
- Node Operator Registry
- Voting
- EasyTrack
- Deposit Security Module

## Developing

Install dependencies with `yarn` and run `yarn codegen`. Repeat `yarn codegen` after any schema changes or changes affecting generated files.

## Testing

You can test any synced Lido deployment, simply fill an `.env` file and run:

```
yarn test
```

## Deploying

### Locally

First, set an `.env` file. You can check an example in `.env.local.example`.

Run `create-local` first if Subgraph does not exist yet.
Run `deploy-local` to deploy the Subgraph.

### The Graph Hosted

Pushes to master branch will automatically get the Subgraph deployed to The Graph.

## Notes

1. Addresses are stored as-is, without conversion to checksum addresses. Keep that in mind when filtering entities by address.
2. Please note that it's now advised not to rely on this Subgraph's node operator keys for duplicate key checks. We've hit a technical limitation on withdrawal credentials changes when unused keys are cropped. We can't guarantee cropped keys will be deleted from this Subgraph correctly in the future.
