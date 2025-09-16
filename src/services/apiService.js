import axios from 'axios';
import {formatEther} from "ethers";
import {API_KEYS, EXPLORER_APIS} from "../lib/config";

// const API_BASE_URL = 'https://ziarapi.myterranet.com/api'
const API_BASE_URL = 'http://127.0.0.1:3000/api';
const API_DB_URL = 'http://127.0.0.1:8000/api';

let ethPriceCache = {
  value: null,
  timestamp: 0
};

export const fetchCollections = async (page, chainId) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/marketplace/okx/collections`, {
      page, chainId
    });
    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};

export const getNftCollection = async ({ sortBy, priceRangeMin, priceRangeMax, pageNum, pageSize, projectIn, stateIn }) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/marketplace/okx/get-nfts`,
      {
        sortBy,
        priceRangeMin,
        priceRangeMax,
        pageNum,
        pageSize,
        projectIn,
        stateIn
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};



export const weiToUSD = (amountWei, ethPriceUSD) => {
  const ethAmount = parseFloat(formatEther(amountWei));
  return (ethAmount * ethPriceUSD).toFixed(3);
}


export const fetchNftDetails = async (nftId, ethPrice = null, all= null) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/marketplace/okx/details`, {
      params: { nftId, ethPrice, all },
    });

    return res.data;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};

export const buyNft = async (chain, walletAddress, orderId, nftId) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/marketplace/okx/buy`, {
      chain,
      walletAddress,
      items: [{
        orderId: orderId,
        nftId: nftId,
        takeCount: 1
      }],
    });

    return res.data?.data;
  } catch (err) {
    throw err.response?.data?.error || err.message;
  }
};

export const confirmPurchaseNft = async ({keystore, password, recipient, amount, input, gasLimit, chainId}) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/marketplace/okx/purchase`, {
      keystore,
      password,
      to: recipient,
      value: amount,
      input,
      gasLimit,
      chainId
    });

    return res.data?.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

//Tairun Collections
export const saveListingNft = async (data) => {
  try {
    const res = await axios.post(`${API_DB_URL}/nft/listings`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

export const cancelListingNft = async (data) => {
  try {
    const res = await axios.post(`${API_DB_URL}/nft/cancel-listing`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};


export const getListingNft = async (data) => {
  try {
    const res = await axios.get(`${API_DB_URL}/nft/listings/by-collection`, {
      params: data
    });

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

export const getListed = async (data) => {
  try {
    const res = await axios.post(`${API_DB_URL}/nft/listed`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};


export const updateListed = async (data) => {
  try {
    const res = await axios.post(`${API_DB_URL}/nft/listed-update`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};


export const getCollection = async (address) => {
  try {
    const res = await axios.post(`${API_DB_URL}/collection/get`, {address}, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

export const getMyNftData = async (data) => {
  try {
    const res = await axios.post(`${API_DB_URL}/nft/my-nft`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

export const updateMyNft = async (nft, image) => {
  const data = {
    ...nft,
    image
  }
  try {
    const res = await axios.post(`${API_DB_URL}/nft/update-my-nft`, data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

export const getListingNftByContract = async (data) => {
  console.log(54656676, data)
  try {
    const res = await axios.post(`${API_DB_URL}/nft/listing-by-contract`, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
      },
    })

    return res.data;
  } catch (err) {
    console.log(555, err)
    throw err.response?.data?.error || err.message;
  }
};

// export const getEthPriceUSD = async () => {
//   const res = await axios.get(
//     'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
//   );
//   return res.data.ethereum.usd;
// }

export const getEthPriceUSD = async () => {
  const cacheKey = 'ethPriceUSD';
  const cacheDuration = 2 * 60 * 1000;
  const now = Date.now();

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (now - parsed.timestamp < cacheDuration) {
      return parsed.value;
    }
  }

  const res = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
  );

  const price = res.data.ethereum.usd;

  localStorage.setItem(cacheKey, JSON.stringify({
    value: price,
    timestamp: now
  }));

  return price;
};




export const createActivity = async (type, userAccount, payload) => {
  try {
    await axios.post(`${API_DB_URL}/v1/activity`, payload);
  } catch (err) {
    console.error('Activity logging failed', err);
  }
};

export const updateStatusListing = async (nftContract, nftTokenId, buyer) => {
  try {
    await axios.post(`${API_DB_URL}/v1/update-listing-status`, {
      contract: nftContract,
      tokenId: nftTokenId.toString(),
      buyer
    },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
  } catch (err) {
    console.error('Activity logging failed', err);
  }
};

export const fetchIPFS = async (cidPath, timeout = 10000) => {
  const gateways = [
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://ipfs.io/ipfs/', // adăugat ultimul, e cel mai lent uneori
  ];

  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  for (let gateway of gateways) {
    const url = gateway + cidPath.replace(/^ipfs:\/\//, '');

    try {
      const res = await fetch(url, { signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          return await res.json();
        } else {
          return await res.text(); // fallback pentru text sau HTML
        }
      } else {
        console.warn(`❌ ${gateway} răspunde cu status: ${res.status}`);
      }
    } catch (err) {
      console.warn(`⚠️  Eroare la ${gateway}:`, err.message);
    }
  }

  throw new Error("❌ Nu s-a putut prelua conținutul IPFS de la niciun gateway.");
};

