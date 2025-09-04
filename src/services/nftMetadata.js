import { ethers } from "ethers";
import ERC721_ABI from "../abis/ERC721.json";
import ERC1155_ABI from "../abis/ERC1155.json";

const provider = new ethers.JsonRpcProvider("https://rpc.taiko.xyz");

/**
 * Fixează link-uri IPFS sau gateway-uri custom
 */
function fixIpfsLink(url) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

/**
 * Înlocuiește {id} cu tokenId hex (64 chars)
 */
function replaceIdPlaceholder(uri, tokenId) {
  // eslint-disable-next-line no-undef
  const hexId = BigInt(tokenId).toString(16).padStart(64, "0");
  return uri.replace("{id}", hexId);
}

/**
 * Preia metadata completă pentru un NFT
 */
async function fetchNFTMetadata(tx) {
  try {
    const isERC721 = tx.tokenDecimal === "0"; // ERC721 are 0 decimals
    const abi = isERC721 ? ERC721_ABI : ERC1155_ABI;
    const contract = new ethers.Contract(tx.contractAddress, abi, provider);

    let tokenURI;

    if (isERC721) {
      tokenURI = await contract.tokenURI(tx.tokenID);
    } else {
      tokenURI = await contract.uri(tx.tokenID);
    }

    // Dacă e ERC1155 și are {id}, îl înlocuim
    if (!isERC721 && tokenURI.includes("{id}")) {
      tokenURI = replaceIdPlaceholder(tokenURI, tx.tokenID);
    }

    // Fix IPFS link
    tokenURI = fixIpfsLink(tokenURI);

    // Fetch metadata JSON
    const res = await fetch(tokenURI);
    const metadata = await res.json();

    // Fix IPFS image
    metadata.image = fixIpfsLink(metadata.image);

    return {
      contract: tx.contractAddress,
      tokenId: tx.tokenID,
      name: metadata.name || `${tx.tokenName} #${tx.tokenID}`,
      description: metadata.description || "",
      image: metadata.image || "",
      attributes: metadata.attributes || [],
      txHash: tx.hash,
    };
  } catch (err) {
    console.error(`❌ Eroare la NFT ${tx.tokenID}`, err);
    return null;
  }
}

/**
 * Procesare listă completă de tranzacții Taikoscan
 */
export async function loadNFTsFromTaikoscan(apiUrl) {
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.status !== "1") {
      console.error("❌ Eroare API Taikoscan:", data.message);
      return [];
    }

    const results = [];
    for (const tx of data.result) {
      const nft = await fetchNFTMetadata(tx);
      if (nft) results.push(nft);
    }

    return results;
  } catch (err) {
    console.error("❌ Eroare generală loadNFTsFromTaikoscan:", err);
    return [];
  }
}
