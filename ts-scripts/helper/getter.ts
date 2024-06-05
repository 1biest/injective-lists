import { Network, isTestnet, isMainnet } from '@injectivelabs/networks'
import {
  readJSONFile,
  denomsToDenomMap,
  tokensToDenomMap,
  bankMetadataToAddressMap
} from './../helper/utils'
import { Token, BankMetadata } from './../types'

const devnetBankMetadataAddressMap = bankMetadataToAddressMap(
  readJSONFile({ path: 'data/bankMetadata/devnet.json' })
)
const testnetBankMetadataAddressMap = bankMetadataToAddressMap(
  readJSONFile({ path: 'data/bankMetadata/testnet.json' })
)
const mainnetBankMetadataAddressMap = bankMetadataToAddressMap(
  readJSONFile({ path: 'data/bankMetadata/mainnet.json' })
)

const devnetInsuranceFundsMap = tokensToDenomMap(
  readJSONFile({ path: 'data/insuranceFunds/devnet.json' })
)
const testnetInsuranceFundsMap = tokensToDenomMap(
  readJSONFile({ path: 'data/insuranceFunds/testnet.json' })
)
const mainnetInsuranceFundsMap = tokensToDenomMap(
  readJSONFile({ path: 'data/insuranceFunds/mainnet.json' })
)

const devnetSupplyDenomMap = denomsToDenomMap(
  readJSONFile({ path: 'data/bankSupplyDenoms/devnet.json' })
)

const testnetSupplyDenomMap = denomsToDenomMap(
  readJSONFile({ path: 'data/bankSupplyDenoms/testnet.json' })
)

const mainnetSupplyDenomMap = denomsToDenomMap(
  readJSONFile({ path: 'data/bankSupplyDenoms/mainnet.json' })
)

const mainnetCw20Denoms = readJSONFile({
  path: 'data/cw20Denoms/mainnet.json'
})
const testnetCw20Denoms = readJSONFile({
  path: 'data/cw20Denoms/testnet.json'
})
const devnetCw20Denoms = readJSONFile({
  path: 'data/cw20Denoms/devnet.json'
})

export const getSupplyDenom = (
  denom: string,
  network: Network
): string | undefined => {
  const formattedDenom = denom.toLowerCase()

  if (isMainnet(network)) {
    return mainnetSupplyDenomMap[formattedDenom]
  }

  if (isTestnet(network)) {
    return testnetSupplyDenomMap[formattedDenom]
  }

  return devnetSupplyDenomMap[formattedDenom]
}

export const getBankTokenFactoryMetadataByAddress = (
  denom: string,
  network: Network
): BankMetadata | undefined => {
  const formattedDenom = denom
  let list = devnetBankMetadataAddressMap

  if (isTestnet(network)) {
    list = testnetBankMetadataAddressMap
  }

  if (isMainnet(network)) {
    list = mainnetBankMetadataAddressMap
  }

  const metadatas = list[formattedDenom]

  if (!metadatas) {
    return
  }

  return metadatas[0]
}

export const getInsuranceFundToken = (
  denom: string,
  network: Network
): Token | undefined => {
  const formattedDenom = denom.toLowerCase()

  if (isMainnet(network)) {
    return mainnetInsuranceFundsMap[formattedDenom]
  }

  if (isTestnet(network)) {
    return testnetInsuranceFundsMap[formattedDenom]
  }

  return devnetInsuranceFundsMap[formattedDenom]
}

export const getCw20Denom = (
  denomOrAddress: string,
  network: Network
): string => {
  let list = devnetCw20Denoms

  if (isMainnet(network)) {
    list = mainnetCw20Denoms
  }

  if (isTestnet(network)) {
    list = testnetCw20Denoms
  }

  return list.find((cw20Denom: string) => {
    return cw20Denom.endsWith(denomOrAddress)
  })
}
