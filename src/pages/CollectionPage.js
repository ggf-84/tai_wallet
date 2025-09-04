import Collection from "../components/Collection";
import {useLocation} from "react-router-dom";
import TaiRunCollection from "../components/tairun/Collection";
import {getEthPriceUSD} from "../services/apiService";
import {useEffect, useState} from "react";

export default function CollectionPage() {
  const {state} = useLocation();
  const type = state?.type

  const [ethPriceUSD, setEthPriceUSD] = useState(null);

  useEffect(() => {
    const weiToUSDCalculate = async () => {
      const ethUSD = await getEthPriceUSD(); // obține cursul actual ETH
      setEthPriceUSD(ethUSD)
    }

    weiToUSDCalculate();
  },[])

  return type === "okx" ? <Collection /> : <TaiRunCollection/>;
}
