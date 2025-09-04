import React, {useState} from "react";
import Button from "./Button";
import {buyNft, confirmPurchaseNft, fetchNftDetails} from "../services/apiService";
import PurchaseModal from "./PurchaseModal";
import Toast from "./Toast";
import {ethers} from "ethers";
import {useMainContext} from "../context/Context";

const PurchaseNft = ({nft, price = null}) => {
  const {wallet, chainId, gasLimit, setShowWalletModal, walletType, provider} = useMainContext();

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [purchaseModal, setPurchaseModal] = useState({
    isOpen: false,
    nft: null,
    steps: []
  });

  const [purchaseData, setPurchaseData] = useState({
    to: null,
    input: null,
    amount: null
  });

  const handlePurchaseNFT = async (nft) => {
    if (!['browser','tairun'].includes(walletType)) {
      setToast({ message: "No wallet connected", type: 'error' });
      console.log(456576878, walletType)
      setShowWalletModal(true)
      return;
    }

    if (walletType === 'tairun') {
      setPurchaseModal({
        isOpen: true,
        nft,
        steps: []
      });
    }

    try {
      const {data} = await fetchNftDetails(nft.id, price ?? nft?.sale.price);
      if(!data.id) {
        setToast({ message: `No any orders found for NFT #${nft.tokenId}`, type: 'error' });
        return;
      }

      const nftToBuy = await buyNft(chainId, wallet?.userAccount, data.id, nft.id);
      const item = nftToBuy?.steps[0]?.items[0];

      if (walletType === 'browser') {
        // 🧠 Logică pentru MetaMask / browser wallet
        // const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const tx = await signer.sendTransaction({
          to: item.contractAddress,
          data: item.input,
          value: ethers.toBigInt(item.value),
          gasLimit: 300000 // sau estimează dinamic
        });

        await tx.wait();
        setToast({ message: "NFT bought successfully with MetaMask", type: 'success' });

      } else {
        // 🔐 Logică existentă cu keystore/mnemonic wallet
        setPurchaseData({
          to: item.contractAddress,
          input: item.input,
          amount: item.value
        });
      }

    } catch (error) {
      console.error('Error on NFT purchase:', error.message);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setToast({ message: "Transaction was canceled by user", type: 'error' });
      } else if (error.code === -32603 || error.message.includes('insufficient funds')) {
        setToast({ message: "Not enough founds! Supply your balance and try again", type: 'error' });
      } else {
        if (error?.reason) {
          setToast({ message: `Error: ${error.reason}`, type: 'error' });
        }else{
          setToast({ message: `Error: ${error.message}`, type: 'error' });
        }
      }
    }
  };

  const confirmPurchase = async () => {
    setLoading(true);

    const sendPromise = confirmPurchaseNft({
      keystore: wallet?.encryptedJson,
      password: wallet?.encryptedSecret,
      recipient: purchaseData.to,
      amount: purchaseData.amount,
      input: purchaseData.input,
      gasLimit,
      chainId
    });

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve('timeout'), 4000)
    );

    try {
      const result = await Promise.race([sendPromise, timeoutPromise]);

      if (result && result.error) {
        setToast({ message: `Transaction failed: ${result.error}`, type: 'error' });
      }

      if (result === 'timeout' || (result && result.status)) {
        setToast({ message: 'The transaction will be completed soon!', type: 'success' });
        closePurchaseModal()
      }

      sendPromise.then(res => {
        if (res && res.status) {
          toast.success(`Successful transaction`);
          setToast({ message: 'Successful transaction', type: 'success' });
          setPurchaseData({to: null, input: null, amount: null})
        } else if (res && res.error) {
          setToast({ message: `Transaction failed: ${res?.error}`, type: 'error' });
        }
      }).catch(err => {
        setToast({ message: `Transaction failed: ${err?.message ?? err}`, type: 'error' });
      });

    } catch (err) {
      setToast({ message: err?.message || 'Transaction failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const closePurchaseModal = () => {
    setPurchaseData({to: null, input: null, amount: null})
    setPurchaseModal({ isOpen: false, nft: null, steps: [] });
  };


  if(nft.sale && typeof nft.sale?.price === 'number' && nft.sale?.price > 0) {
    return (
      <>
        <Button onClick={() => handlePurchaseNFT(nft)} disabled={loading}>
          {loading ? 'processing...' : 'BUY'}
        </Button>

        <PurchaseModal
          isOpen={purchaseModal.isOpen}
          nft={purchaseModal.nft}
          steps={purchaseModal.steps}
          onClose={closePurchaseModal}
          onPurchase={confirmPurchase}
        />

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      </>
    );
  }

  return '';

};
export default PurchaseNft;
