import { useEffect, useState } from 'react';

export const useListedNFTsByCollectionPaginated = (
  marketplaceContract,
  collectionAddress,
  page = 1,
  pageSize = 20,
  totalCount = null // dacă contractul nu oferă un total, poți seta manual
) => {
  const [nfts, setNfts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketplaceContract || !collectionAddress) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const totalItems = totalCount ?? await marketplaceContract.totalItems?.() ?? 1000;
        const listings = [];

        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        let collected = 0;
        let index = startIndex;

        while (index < totalItems && collected < pageSize) {
          try {
            const item = await marketplaceContract.marketItems(index);

            const sameCollection = item.nftContract.toLowerCase() === collectionAddress.toLowerCase();
            const isListed = item.status === 0 || item.buyer === '0x0000000000000000000000000000000000000000';

            if (sameCollection && isListed) {
              listings.push({ ...item, itemId: index });
              collected++;
            }
          } catch (e) {
            // item doesn't exist or has been deleted
          }

          index++;
        }

        setNfts(listings);
        setTotal(Number(totalItems));
      } catch (e) {
        console.error("❌ Error loading paginated collection NFTs:", e);
        setNfts([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [marketplaceContract, collectionAddress, page, pageSize]);

  return { nfts, total, loading };
};
