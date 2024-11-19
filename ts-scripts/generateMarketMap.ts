import { SpotMarket } from '@injectivelabs/sdk-ts'
import { Network, isMainnet } from '@injectivelabs/networks'
import {
  getSpotMarketsByNetwork,
  getDerivativeMarketsByNetwork
} from './helper/market'
import { updateJSONFile, getNetworkFileName } from './helper/utils'
import { MarketSlugId } from './types'

const MAINNET_SPOT_MARKETS_TO_IGNORE = [
  '0xda0bb7a7d8361d17a9d2327ed161748f33ecbf02738b45a7dd1d812735d1531c', //USDT/USDC,
  '0xac938722067b1dfdfbf346d2434573fb26cb090d309b19af17df2c6827ceb32c', // SOL/USDT
  '0xb9a07515a5c239fcbfa3e25eaa829a03d46c4b52b9ab8ee6be471e9eb0e9ea31', // WMATIC/USDT
  '0xb965ebede42e67af153929339040e650d5c2af26d6aa43382c110d943c627b0a', // PYTH/INJ
  '0x1bba49ea1eb64958a19b66c450e241f17151bc2e5ea81ed5e2793af45598b906', // ARB/USDT
  '0x66a113e1f0c57196985f8f1f1cfce2f220fa0a96bca39360c70b6788a0bc06e0', //LDO/USDC
  '0x959c9401a557ac090fff3ec11db5a1a9832e51a97a41b722d2496bb3cb0b2f72', // ANDR/INJ
  '0xb62dc3aaabd157ec3f9f16f6efe2eec3377b28e273d23de93f8b0bcf33c6058f', // NONJA/INJ
  '0x75f6a79b552dac417df219ab384be19cb13b53dec7cf512d73a965aee8bc83af' // USDY/USDT
]

const generateSpotMarketMap = async (network: Network) => {
  const spotMarkets = getSpotMarketsByNetwork(network)

  try {
    const marketMap = spotMarkets.reduce(
      (list: Record<string, MarketSlugId>, market: SpotMarket) => {
        const slug = market.ticker.replace('/', '-').toLowerCase()

        if (
          isMainnet(network) &&
          MAINNET_SPOT_MARKETS_TO_IGNORE.includes(market.marketId)
        ) {
          return list
        }

        if (isMainnet(network) && list[slug]) {
          console.log(`Duplicate spot ticker ${market.ticker}`)
        }

        list[slug] = {
          slug,
          marketId: market.marketId
        }

        return list
      },
      {} as Record<string, MarketSlugId>
    )

    await updateJSONFile(
      `data/market/spot/slugMap/${getNetworkFileName(network)}.json`,
      marketMap
    )

    console.log(`✅✅✅ generateSpotMarketMap ${network}`)
  } catch (e) {
    console.log(`Error generating spot market map ${network}:`, e)
  }
}

const generateDerivativeMarketMap = async (network: Network) => {
  const derivativeMarkets = getDerivativeMarketsByNetwork(network)

  try {
    const marketMap = derivativeMarkets.reduce(
      (list: Record<string, MarketSlugId>, market: SpotMarket) => {
        const slug = market.ticker
          .replace('/', '-')
          .replace(' ', '-')
          .toLowerCase()

        if (isMainnet(network) && list[slug]) {
          console.log(`Duplicate derivative ticker ${market.ticker}`)
        }

        list[slug] = {
          slug,
          marketId: market.marketId
        }

        return list
      },
      {} as Record<string, MarketSlugId>
    )

    await updateJSONFile(
      `data/market/derivative/slugMap/${getNetworkFileName(network)}.json`,
      marketMap
    )

    console.log(`✅✅✅ generateDerivativeMarketMap ${network}`)
  } catch (e) {
    console.log(`Error generating derivative market map ${network}:`, e)
  }
}

generateSpotMarketMap(Network.Devnet)
generateSpotMarketMap(Network.TestnetSentry)
generateSpotMarketMap(Network.MainnetSentry)

generateDerivativeMarketMap(Network.Devnet)
generateDerivativeMarketMap(Network.TestnetSentry)
generateDerivativeMarketMap(Network.MainnetSentry)
