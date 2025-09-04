import {API_KEYS, EXPLORER_APIS} from "../lib/config";

export const getNFTTransactionsUrl = ({ chainId, collectionAddress, userAddress, tokenType = 0 }) => {
  try {
    const baseUrl = EXPLORER_APIS[chainId];
    const apiKey = API_KEYS[chainId];

    if (!baseUrl || !apiKey) {
      throw new Error(`No API endpoint or key configured for chainId ${chainId}`);
    }

    const action = tokenType === 0 ? "tokennfttx" : "token1155tx";

    // const addrr = "0x45c8c213c36b410404184559b95944aa79c28614";

   return `${baseUrl}?module=account&action=${action}&contractaddress=${collectionAddress}&address=${userAddress}&page=1&offset=1000&sort=asc&apikey=${apiKey}`;

  } catch (err) {
    console.error(`❌ Failed to get NFT transactions url:`, err.message);
    return null;
  }
}
