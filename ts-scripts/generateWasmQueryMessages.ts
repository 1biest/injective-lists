import { toBase64, ChainGrpcWasmApi } from '@injectivelabs/sdk-ts'
import { Network, getNetworkEndpoints } from '@injectivelabs/networks'
import {
  readJSONFile,
  updateJSONFile,
  getNetworkFileName
} from './helper/utils'
import {
  fetchCodeIdsByNetwork,
  wasmErrorToMessageArray,
  getContractAddressByCodeId
} from './helper/wasm'

const args = process.argv.slice(2)
const shouldForceFetch = args.includes('-f') || args.includes('--force')

export const updateQueryMessageJson = async (
  network: Network,
  item: Record<string, string[]>
) => {
  const filePath = `json/wasm/query/${getNetworkFileName(network)}.json`

  const updatedList = {
    ...readJSONFile({
      path: filePath,
      fallback: {}
    }),
    ...item
  }

  try {
    await updateJSONFile(filePath, updatedList)
  } catch (e) {
    console.log('Error updating wasm query messages', e)
  }
}

export const generateWasmQueryMessages = async (network: Network) => {
  const codeIdsList = fetchCodeIdsByNetwork(network)

  const queryPath = `json/wasm/query/${getNetworkFileName(network)}.json`
  const existingCodeIdMessagesMap = readJSONFile({
    path: queryPath,
    fallback: {}
  }) as Record<string, string[]>

  const codeIdsToFetch = codeIdsList
    .filter(
      (codeId) => !Object.keys(existingCodeIdMessagesMap).includes(`${codeId}`)
    )
    .map((codeId) => `${codeId}`)

  const existingCodeIdsToRefetch = !shouldForceFetch
    ? []
    : Object.entries(existingCodeIdMessagesMap).reduce(
        (list, [codeId, messages]) => {
          if (messages.length === 0) {
            list.push(codeId)
          }

          return list
        },
        [] as string[]
      )

  console.log(`fetching wasm query messages for ${network} codeIds:`, [
    ...codeIdsToFetch,
    ...existingCodeIdsToRefetch
  ])

  await fetchWasmQueryMessages(network, [
    ...codeIdsToFetch,
    ...existingCodeIdsToRefetch
  ])
}

export const fetchWasmQueryMessages = async (
  network: Network,
  codeIds: string[]
) => {
  const endpoints = getNetworkEndpoints(network)
  const wasmApi = new ChainGrpcWasmApi(endpoints.grpc)

  try {
    for (const codeId of codeIds) {
      const contractAddress = await getContractAddressByCodeId(network, codeId)

      if (!contractAddress) {
        await updateQueryMessageJson(network, { [codeId]: [] })

        continue
      }

      const queryToGetBackMessageList = { '': {} }
      const messageToBase64 = toBase64(queryToGetBackMessageList)

      try {
        await wasmApi.fetchSmartContractState(contractAddress, messageToBase64)
      } catch (e) {
        await updateQueryMessageJson(network, {
          [codeId]: wasmErrorToMessageArray(e)
        })
      }
    }

    console.log(`✅✅✅ generateWasmQueryMessages ${network}`)
  } catch (e) {
    console.log('Error generating Wasm Query Messages', e)
  }
}

generateWasmQueryMessages(Network.Devnet)
generateWasmQueryMessages(Network.TestnetSentry)
generateWasmQueryMessages(Network.MainnetSentry)
