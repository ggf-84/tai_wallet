export const TAIKO_CHAIN_ID = '0x28c58'; // 167000 in decimal
// const MARKETPLACE_ADDRESS = '0xe0699ff32dc993bf0ee34f897aa21dc522b162a4'; // NEW CONTRACT ADDRESS

export const API_KEYS = {
  1: process.env.ETHERSCAN_API_KEY,      // Ethereum Mainnet
  137: process.env.POLYGONSCAN_API_KEY,  // Polygon
  56: process.env.BSCSCAN_API_KEY,       // BSC
  42161: process.env.ARBISCAN_API_KEY,   // Arbitrum
  167000: 'RMV3HIEJ9M3982FKIKMCZTZ9SSMQHGZEMW',//process.env.TAIKOSCAN_API_KEY, // Taiko
};

export const EXPLORER_APIS = {
  1: "https://api.etherscan.io/api",
  137: "https://api.polygonscan.com/api",
  56: "https://api.bscscan.com/api",
  42161: "https://api.arbiscan.io/api",
  167000: "https://api.taikoscan.io/api",
};

export const MARKETPLACE_ADDRESS = '0x4d68587ef881ac6f7adf0f5d13a66ab724fda7d9'; // NEW CONTRACT ADDRESS
export const WETH_ADDRESS = '0xA51894664A773981C6C112C43ce576f315d5b1B6'; // Taiko mainnet WETH

// TaikoScan API Configuration
export const TAIKOSCAN_API_KEY = 'RMV3HIEJ9M3982FKIKMCZTZ9SSMQHGZEMW';
export const TAIKO_RPC = "https://rpc.mainnet.taiko.xyz";

// EIP-712 Domain Configuration
export const DOMAIN_NAME = "EnhancedSignatureMarketplace";
export const DOMAIN_VERSION = "1";

// ============================================================================
// FIXED EIP-712 TYPE DEFINITIONS - CORRECT ORDER MATCHING CONTRACT TYPEHASH
// ============================================================================

// CRITICAL: These MUST match the exact order from contract TYPEHASH strings!

export const LISTING_TYPE = {
  Listing: [
    { name: 'nftContract', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'price', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'tokenType', type: 'uint8' },
    { name: 'deadline', type: 'uint256' },
    { name: 'seller', type: 'address' },
    { name: 'nonce', type: 'uint256' }
  ]
};

// FIXED: Correct order to match contract TYPEHASH:
// "ItemOffer(address nftContract,uint256 tokenId,uint256 price,uint256 amount,uint8 tokenType,uint256 deadline,address offerer,uint256 nonce)"
export const ITEM_OFFER_TYPE = {
  ItemOffer: [
    { name: 'nftContract', type: 'address' },    // 1. ✅
    { name: 'tokenId', type: 'uint256' },        // 2. ✅
    { name: 'price', type: 'uint256' },          // 3. FIXED (was position 4)
    { name: 'amount', type: 'uint256' },         // 4. FIXED (was position 5)
    { name: 'tokenType', type: 'uint8' },        // 5. ✅
    { name: 'deadline', type: 'uint256' },       // 6. FIXED (was position 7)
    { name: 'offerer', type: 'address' },        // 7. FIXED (was position 3)
    { name: 'nonce', type: 'uint256' }           // 8. ✅
  ]
};

// FIXED: Correct order to match contract TYPEHASH:
// "CollectionOffer(address nftContract,uint256 pricePerItem,uint256 itemCount,uint8 tokenType,uint256 deadline,address offerer,uint256 nonce)"
export const COLLECTION_OFFER_TYPE = {
  CollectionOffer: [
    { name: 'nftContract', type: 'address' },    // 1. ✅
    { name: 'pricePerItem', type: 'uint256' },   // 2. FIXED (was after offerer)
    { name: 'itemCount', type: 'uint256' },      // 3. FIXED (was after offerer)
    { name: 'tokenType', type: 'uint8' },        // 4. ✅
    { name: 'deadline', type: 'uint256' },       // 5. ✅
    { name: 'offerer', type: 'address' },        // 6. FIXED (moved down)
    { name: 'nonce', type: 'uint256' }           // 7. ✅
  ]
};

// Complete Contract ABI - Updated for Signature-Based Offers
export const MARKETPLACE_ABI = [
  // ============================================================================
  // EVENTS
  // ============================================================================
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "nftContract", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "ItemListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "buyer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "ItemSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"}
    ],
    "name": "ItemCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "itemId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "newPrice", "type": "uint256"}
    ],
    "name": "PriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "nftContract", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "offerer", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "ItemOfferAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "nftContract", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "offerer", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "seller", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "price", "type": "uint256"}
    ],
    "name": "CollectionOfferAccepted",
    "type": "event"
  },

  // ============================================================================
  // LISTING FUNCTIONS
  // ============================================================================
  {
    "inputs": [
      {"internalType": "address", "name": "nftContract", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint8", "name": "tokenType", "type": "uint8"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"}
    ],
    "name": "listItem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "nftContract", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint8", "name": "tokenType", "type": "uint8"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "nonce", "type": "uint256"}
        ],
        "internalType": "struct EnhancedSignatureMarketplace.Listing",
        "name": "listing",
        "type": "tuple"
      },
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "buyWithSignature",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "components": [
              {"internalType": "address", "name": "nftContract", "type": "address"},
              {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
              {"internalType": "uint256", "name": "price", "type": "uint256"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"},
              {"internalType": "uint8", "name": "tokenType", "type": "uint8"}
            ],
            "internalType": "struct EnhancedSignatureMarketplace.BatchItem[]",
            "name": "items",
            "type": "tuple[]"
          },
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "nonce", "type": "uint256"}
        ],
        "internalType": "struct EnhancedSignatureMarketplace.BatchListing",
        "name": "batchListing",
        "type": "tuple"
      },
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "createBatchListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ============================================================================
  // BUYING FUNCTIONS
  // ============================================================================
  {
    "inputs": [{"internalType": "uint256", "name": "itemId", "type": "uint256"}],
    "name": "buyItem",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  // ============================================================================
  // SIGNATURE-BASED OFFER SYSTEM
  // ============================================================================
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "nftContract", "type": "address"},
          {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
          {"internalType": "address", "name": "offerer", "type": "address"},
          {"internalType": "uint256", "name": "price", "type": "uint256"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint8", "name": "tokenType", "type": "uint8"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "nonce", "type": "uint256"}
        ],
        "internalType": "struct EnhancedSignatureMarketplace.ItemOffer",
        "name": "offer",
        "type": "tuple"
      },
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "acceptItemOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "nftContract", "type": "address"},
          {"internalType": "address", "name": "offerer", "type": "address"},
          {"internalType": "uint256", "name": "pricePerItem", "type": "uint256"},
          {"internalType": "uint256", "name": "itemCount", "type": "uint256"},
          {"internalType": "uint8", "name": "tokenType", "type": "uint8"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "nonce", "type": "uint256"}
        ],
        "internalType": "struct EnhancedSignatureMarketplace.CollectionOffer",
        "name": "offer",
        "type": "tuple"
      },
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "signature", "type": "bytes"}
    ],
    "name": "acceptCollectionOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ============================================================================
  // LISTING MANAGEMENT
  // ============================================================================
  {
    "inputs": [{"internalType": "uint256", "name": "itemId", "type": "uint256"}],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "itemId", "type": "uint256"},
      {"internalType": "uint256", "name": "newPrice", "type": "uint256"}
    ],
    "name": "updateListingPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // ============================================================================
  // VIEW FUNCTIONS - GENERAL
  // ============================================================================
  {
    "inputs": [],
    "name": "platformFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accumulatedETHFees",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "accumulatedWETHFees",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserNonce",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
    "name": "isOfferSignatureUsed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "marketItems",
    "outputs": [
      {"internalType": "address", "name": "nftContract", "type": "address"},
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "address", "name": "seller", "type": "address"},
      {"internalType": "address", "name": "buyer", "type": "address"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint8", "name": "tokenType", "type": "uint8"},
      {"internalType": "uint8", "name": "status", "type": "uint8"},
      {"internalType": "uint256", "name": "expiresAt", "type": "uint256"},
      {"internalType": "bool", "name": "isSignatureListing", "type": "bool"},
      {"internalType": "bytes32", "name": "batchId", "type": "bytes32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bytes32", "name": "batchId", "type": "bytes32"}],
    "name": "getBatchItems",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },

  // ============================================================================
  // ADMIN FUNCTIONS
  // ============================================================================
  {
    "inputs": [{"internalType": "uint256", "name": "newFee", "type": "uint256"}],
    "name": "setPlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimETHFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimWETHFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// WETH Contract ABI
export const WETH_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "from", "type": "address"}, {"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// NFT Contract ABIs
export const ERC721_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)"
];

export const ERC1155_ABI = [
  "function uri(uint256) view returns (string)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data)"
];


export const FALLBACK_ERC721_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getApproved",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "operator", "type": "address"}],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const FALLBACK_ERC1155_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "address", "name": "operator", "type": "address"}],
    "name": "isApprovedForAll",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
