import {
  TokenType,
  TokenStatic,
  TokenVerification
} from '@injectivelabs/token-metadata'
import { Network } from '@injectivelabs/networks'
import {
  mainnetTokens as cw20MainnetTokens,
  devnetTokens as cw20DevnetTokens,
  testnetTokens as cw20TestnetTokens
} from './data/cw20'
import {
  mainnetTokens as erc20MainnetTokens,
  devnetTokens as erc20DevnetTokens,
  testnetTokens as erc20TestnetTokens
} from './data/erc20'
import {
  mainnetTokens as tokenFactoryMainnetTokens,
  devnetTokens as tokenFactoryDevnetTokens,
  testnetTokens as tokenFactoryTestnetTokens
} from './data/tokenFactory'
import {
  mainnetTokens as ibcMainnetTokens,
  testnetTokens as ibcTestnetTokens
} from './data/ibc'
import { symbolMeta } from './data/symbolMeta'
import { untaggedSymbolMeta } from './data/untaggedSymbolMeta'
import { updateJSONFile, getNetworkFileName } from './helper/utils'
import {
  getSupplyDenom,
  getBankTokenFactoryMetadataByAddress
} from './helper/getter'
import {
  IbcTokenSource,
  Cw20TokenSource,
  PeggyTokenSource,
  TokenFactorySource
} from './types'

const INJ_TOKEN = {
  isNative: true,
  ...symbolMeta.INJ,
  denom: 'inj',
  address: 'inj',
  tokenType: TokenType.Native,
  tokenVerification: TokenVerification.Verified
}

const formatIbcTokens = (tokens: IbcTokenSource[], network: Network) =>
  tokens.map((token) => {
    const denom = `ibc/${token.hash}`
    const supplyDenom = getSupplyDenom(denom, network)

    return {
      ...token,
      denom: supplyDenom || denom,
      tokenType: TokenType.Ibc
    }
  })

const formatTokenFactoryTokens = (
  tokens: TokenFactorySource[],
  network: Network
) => {
  return tokens.reduce((list, token) => {
    const denom = `factory/${token.creator}/${token.symbol.toLowerCase()}`
    const supplyDenom = getSupplyDenom(denom, network)

    list.push({
      ...token,
      address: supplyDenom || denom,
      denom: supplyDenom || denom,
      tokenType: TokenType.TokenFactory,
      tokenVerification: TokenVerification.Verified
    })

    return list
  }, [] as TokenStatic[])
}

const formatCw20Tokens = (tokens: Cw20TokenSource[], network: Network) => {
  return tokens.reduce((list, token) => {
    list.push({
      ...token,
      address: token.address,
      denom: token.address,
      tokenType: TokenType.Cw20,
      tokenVerification: TokenVerification.Verified
    })

    const existingFactoryToken = getBankTokenFactoryMetadataByAddress(
      token.address.toLowerCase(),
      network
    )

    if (existingFactoryToken) {
      list.push({
        ...token,
        denom: existingFactoryToken.denom,
        address: token.address,
        tokenType: TokenType.TokenFactory,
        tokenVerification: TokenVerification.Internal,
        decimals: existingFactoryToken.decimals || token.decimals
      })
    }

    return list
  }, [] as TokenStatic[])
}

const formatErc20Tokens = (tokens: PeggyTokenSource[], network: Network) =>
  tokens.map((token) => {
    const denom = `peggy${token.address}`
    const supplyDenom = getSupplyDenom(denom, network)

    return {
      ...token,
      denom: supplyDenom || denom,
      tokenType: TokenType.Erc20
    }
  })

// perp market base tokens
const untaggedSymbolBaseTokens = () =>
  Object.values(untaggedSymbolMeta).map((meta) => {
    return {
      ...meta,
      tokenType: TokenType.Symbol,
      tokenVerification: TokenVerification.Internal,
      denom: meta.symbol.toLowerCase(),
      address: meta.symbol.toLowerCase()
    }
  })

const getDevnetStaticTokenList = () => {
  return [
    ...formatIbcTokens(
      [...ibcTestnetTokens, ...ibcMainnetTokens],
      Network.Devnet
    ),
    ...formatCw20Tokens(
      [...cw20DevnetTokens, ...cw20TestnetTokens, ...cw20MainnetTokens],
      Network.Devnet
    ),
    ...formatErc20Tokens(
      [...erc20DevnetTokens, ...erc20TestnetTokens, ...erc20MainnetTokens],
      Network.Devnet
    ),
    ...formatTokenFactoryTokens(
      [
        ...tokenFactoryDevnetTokens,
        ...tokenFactoryTestnetTokens,
        ...tokenFactoryMainnetTokens
      ],
      Network.Devnet
    )
  ]
}

const getTestnetStaticTokenList = () => {
  return [
    ...formatIbcTokens(
      [...ibcTestnetTokens, ...ibcMainnetTokens],
      Network.TestnetSentry
    ),
    ...formatCw20Tokens(
      [...cw20TestnetTokens, ...cw20DevnetTokens, ...cw20MainnetTokens],
      Network.TestnetSentry
    ),
    ...formatErc20Tokens(
      [...erc20TestnetTokens, ...erc20DevnetTokens, ...erc20MainnetTokens],
      Network.TestnetSentry
    ),
    ...formatTokenFactoryTokens(
      [
        ...tokenFactoryTestnetTokens,
        ...tokenFactoryDevnetTokens,
        ...tokenFactoryMainnetTokens
      ],
      Network.TestnetSentry
    )
  ]
}

const getMainnetStaticTokenList = () => {
  return [
    ...formatIbcTokens(ibcMainnetTokens, Network.MainnetSentry),
    ...formatCw20Tokens(
      [...cw20MainnetTokens, ...cw20TestnetTokens],
      Network.MainnetSentry
    ),
    ...formatErc20Tokens(erc20MainnetTokens, Network.MainnetSentry),
    ...formatTokenFactoryTokens(
      tokenFactoryMainnetTokens,
      Network.MainnetSentry
    )
  ]
}

const generateStaticTokens = async (network: Network) => {
  let list = [] as any

  if (network === Network.Devnet) {
    list = getDevnetStaticTokenList()
  }

  if (network === Network.TestnetSentry) {
    list = getTestnetStaticTokenList()
  }

  if (network === Network.MainnetSentry) {
    list = getMainnetStaticTokenList()
  }

  await updateJSONFile(
    `tokens/staticTokens/${getNetworkFileName(network)}.json`,
    [INJ_TOKEN, ...list, ...untaggedSymbolBaseTokens()]
      .map((token) => ({
        address: token.denom,
        isNative: false,
        tokenVerification: TokenVerification.Verified,
        ...token
      }))
      .sort((a, b) => a.denom.localeCompare(b.denom))
  )

  console.log(`✅✅✅ GenerateStaticTokens ${network}`)
}

generateStaticTokens(Network.Devnet)
generateStaticTokens(Network.TestnetSentry)
generateStaticTokens(Network.MainnetSentry)
