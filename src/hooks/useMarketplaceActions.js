// import { useState } from 'react';
// import { parseEther } from 'ethers';
//
// export function useMarketplaceActions(marketplaceContract, signer, toast) {
//   const [loadingAction, setLoadingAction] = useState(false);
//
//   const buyNFT = async (itemId, priceETH, tokenType = 0, amount = 1) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).buyItem(itemId, amount, {
//         value: parseEther(priceETH.toString()),
//       });
//       await tx.wait();
//       toast({ message: `✅ NFT #${itemId} purchased`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Buy failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const makeOffer = async (nftContract, tokenId, offerPriceETH, tokenType = 0, amount = 1) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).makeOffer(
//         nftContract,
//         tokenId,
//         tokenType,
//         amount,
//         {
//           value: parseEther(offerPriceETH.toString()),
//         }
//       );
//       await tx.wait();
//       toast({ message: `✅ Offer placed on #${tokenId}`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Offer failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const cancelListing = async (itemId) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).cancelListing(itemId);
//       await tx.wait();
//       toast({ message: `🗑️ Listing #${itemId} cancelled`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Cancel failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const acceptOffer = async (itemId) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).acceptOffer(itemId);
//       await tx.wait();
//       toast({ message: `🤝 Offer on item #${itemId} accepted`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Accept failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const withdrawOffer = async (nftContract, tokenId) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).withdrawOffer(nftContract, tokenId);
//       await tx.wait();
//       toast({ message: `❌ Offer withdrawn for token #${tokenId}`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Withdraw failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const makeCollectionOffer = async (collectionAddress, offerPriceETH, tokenType = 0, amount = 1) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).makeCollectionOffer(
//         collectionAddress,
//         tokenType,
//         amount,
//         {
//           value: parseEther(offerPriceETH.toString())
//         }
//       );
//       await tx.wait();
//       toast({ message: `✅ Offer placed for collection`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Offer failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//   const withdrawCollectionOffer = async (collectionAddress) => {
//     setLoadingAction(true);
//     try {
//       const tx = await marketplaceContract.connect(signer).withdrawCollectionOffer(collectionAddress);
//       await tx.wait();
//       toast({ message: `❌ Withdrawn offer for collection`, type: 'success' });
//     } catch (err) {
//       toast({ message: `❌ Withdraw failed: ${err.message}`, type: 'error' });
//     } finally {
//       setLoadingAction(false);
//     }
//   };
//
//
//   return {
//     loadingAction,
//     buyNFT,
//     makeOffer,
//     cancelListing,
//     acceptOffer,
//     withdrawOffer,
//     makeCollectionOffer,
//     withdrawCollectionOffer
//   };
// }

import axios from 'axios';
import {parseEther, keccak256, toUtf8Bytes} from 'ethers';
import {
  ITEM_OFFER_TYPE,
  COLLECTION_OFFER_TYPE,
  DOMAIN_NAME,
  DOMAIN_VERSION,
  MARKETPLACE_ADDRESS,
} from '../lib/config';
import {useMainContext} from "../context/Context";
import {useState} from "react";
import {createActivity, getListingNftByContract, updateStatusListing} from "../services/apiService";

export const useMarketplaceActions = (toast) => {

  const {userAccount, userSigner, marketplaceContract, contract} = useMainContext(); // ai grijă să aduci contextul tău
  const [loadingAction, setLoadingAction] = useState(false);

  // 'action' => 'required|string',
  //   'action_maker' => 'required|string',
  //   'second_address' => 'nullable|string',
  //   'contract' => 'nullable|string',
  //   'token_id' => 'nullable|integer',
  //   'price' => 'nullable|numeric',
  //   'old_price' => 'nullable|numeric',
  //   'token_type' => 'nullable|integer',
  //   'hash' => 'nullable|integer',
  //   'timestamp' => 'nullable|date',

  const buyItem = async (id, nftContract, nftTokenId) => {
    setLoadingAction(true);
    const {listed} = await getListingNftByContract({id, nftContract, nftTokenId});
    const totalValue = listed.listing?.price;

    console.log( 43545465676, listed?.listing, listed.signature, totalValue)

    try {
      const tx = await contract.buyWithSignature(listed?.listing, listed.signature, {
        value: totalValue,
        gasLimit: 300000
      });

      await tx.wait();

      // await createActivity({
      //   action: 'nft_purchased',
      //   action_maker: userAccount,
      //   item_id: listed.listing?.tokenId,
      //   price: listed.listing?.price?.toString(),
      //   token_type: listed.listing?.tokenType,
      //   amount: 1,
      //   timestamp: new Date().toISOString()
      // });

      // const data =  {
      //   contract: listing?.nftContract,
      //   action_maker: userAccount,
      // }

      await updateStatusListing(nftContract, nftTokenId, userAccount); // API care setează status "sold" sau șterge listarea

      console.log('NFT Bought!');
      // return tx.hash;
      toast({message: `NFT #${listed.listing?.tokenId} purchased`, type: 'success'});
    } catch (err) {
      console.log('NFT Bought failed!', err.message);
      toast({message: `Purchasing nft failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }
  };

  const makeOffer = async ({contract, tokenId, amount, tokenType, priceETH, deadline}) => {
    setLoadingAction(true);
    try {
      const nonce = await marketplaceContract.getUserNonce(userAccount);
      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: await userSigner.provider.getNetwork().then(n => n.chainId),
        verifyingContract: MARKETPLACE_ADDRESS
      };

      const offer = {
        nftContract: contract.address,
        tokenId,
        price: parseEther(priceETH.toString()).toString(),
        amount,
        tokenType,
        deadline,
        offerer: userAccount,
        nonce: nonce.toString()
      };

      const signature = await userSigner._signTypedData(domain, ITEM_OFFER_TYPE, offer);
      const hash = keccak256(toUtf8Bytes(`${offer.nftContract}_${offer.tokenId}_${offer.price}_${offer.nonce}_${offer.offerer}`));

      await axios.post('/api/v1/offers', {offer, signature, hash});
      await createActivity('offer_made', userAccount, {hash, contract: contract.address, tokenId, price: priceETH});

      toast({message: `Offer placed on #${tokenId}`, type: 'success'});
    } catch (err) {
      toast({message: `Offer failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }
  };

  const cancelOffer = async (hash) => {
    setLoadingAction(true);
    try {
      await axios.delete(`/api/v1/offers/${hash}`);
      await createActivity('offer_cancelled', {hash});

      toast({message: ``, type: 'success'});
    } catch (err) {

    } finally {
      setLoadingAction(false);
    }
  };

  const acceptOffer = async ({offer, signature}) => {
    setLoadingAction(true);
    try {
      const tx = await marketplaceContract.acceptItemOffer(offer, signature);
      await tx.wait();
      await createActivity('offer_accepted', {hash: keccak256(toUtf8Bytes(`${offer.nftContract}_${offer.tokenId}_${offer.price}_${offer.nonce}_${offer.offerer}`))});

      toast({message: `Offer on item #${offer.tokenId} accepted`, type: 'success'});
    } catch (err) {
      toast({message: `Accept offer failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }
  };

  const makeCollectionOffer = async ({contract, pricePerItem, itemCount, tokenType, deadline}) => {
    setLoadingAction(true);
    try {
      const nonce = await marketplaceContract.getUserNonce(userAccount);
      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: await userSigner.provider.getNetwork().then(n => n.chainId),
        verifyingContract: MARKETPLACE_ADDRESS
      };

      const offer = {
        nftContract: contract.address,
        pricePerItem: parseEther(pricePerItem.toString()).toString(),
        itemCount,
        tokenType,
        deadline,
        offerer: userAccount,
        nonce: nonce.toString()
      };

      const signature = await userSigner._signTypedData(domain, COLLECTION_OFFER_TYPE, offer);
      const hash = keccak256(toUtf8Bytes(`${offer.nftContract}_${offer.pricePerItem}_${offer.nonce}_${offer.offerer}`));

      await axios.post('/api/v1/collection-offers', {offer, signature, hash});
      await createActivity('collection_offer_made', {hash, contract: contract.address, price: pricePerItem});

      toast({message: `Offer placed for collection ${offer.nftContract}`, type: 'success'});
    } catch (err) {
      toast({message: `❌ Offer failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }
  };

  const cancelCollectionOffer = async (hash) => {
    setLoadingAction(true);
    try {
      await axios.delete(`/api/v1/collection-offers/${hash}`);
      await createActivity('collection_offer_cancelled', {hash});

      toast({message: `Offer for collection was canceled`, type: 'success'});
    } catch (err) {
      toast({message: `Cancel collection offer failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }
  };

  const acceptCollectionOffer = async ({offer, tokenId, amount, signature}) => {
    setLoadingAction(true);
    try {
      const tx = await marketplaceContract.acceptCollectionOffer(offer, tokenId, amount, signature);
      await tx.wait();
      await createActivity('collection_offer_accepted', {
        hash: keccak256(toUtf8Bytes(`${offer.nftContract}_${offer.pricePerItem}_${offer.nonce}_${offer.offerer}`)),
        tokenId
      });

      toast({message: `Offer for collection was accepted`, type: 'success'});
    } catch (err) {
      toast({message: `Accept collection offer failed: ${err.message}`, type: 'error'});
    } finally {
      setLoadingAction(false);
    }

  };

  return {
    buyItem,
    makeOffer,
    cancelOffer,
    acceptOffer,
    makeCollectionOffer,
    cancelCollectionOffer,
    acceptCollectionOffer,
    loadingAction,
  };
};

