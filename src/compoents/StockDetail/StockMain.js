import React from "react";
import { useSearchParams } from "react-router-dom";
import StockDetailIN from "./StockDetailIN/StockDetailIN";
import StockDetailOUT from "./StockDetailOUT/StockDetailOUT";

const StockMain = () => {
  const [searchParams] = useSearchParams();
  const inData = searchParams.get("inData");
  // return (
  //   <div>
  //     <StockDetailIN />{" "}
  //   </div>
  // );
  return <div>{inData == "true" ? <StockDetailIN /> : <StockDetailOUT />}</div>;
};

export default StockMain;
