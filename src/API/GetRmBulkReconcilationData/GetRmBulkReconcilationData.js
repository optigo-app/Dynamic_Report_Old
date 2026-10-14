import { CommonAPI, CommonAPINew } from "../CommonAPI";

const VERSION =
    window.location.hostname == "localhost" ||
    window.location.hostname == "nzen"
      ?  "R50B3"
      : "live";

export const getMasterMaterialData = async () => {
    const body = {
        con: JSON.stringify({
          id: "",
          mode: "MasterItemList",
          FormName: "BulkReconcile"
        }),
        p: JSON.stringify({ }),
        f: "MasterItemList"
      };

      const data = await CommonAPINew(body,'264',VERSION)
      
       return data?.Data?.rd || []

}


export const GetmaterialWiseData = async (MaterialId) => {
    const body = {
        con: JSON.stringify({
          id: "",
          mode: "InvoiceByMasterItem",
          FormName: "BulkReconcile"
        }),
        p: JSON.stringify({
          master_item_id: MaterialId
        }),
        f: "InvoiceByMasterItem"
      };

      const data = await CommonAPINew(body,'264',VERSION)
      
      return data?.Data?.rd || []

}

export const GetTodaysTransactionData = async (MaterialId) => {
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "CurrentTransactionRFBags"
    }),
    p: JSON.stringify({
      master_item_id: MaterialId
    }),
    f: "CurrentTransactionRFBags"
  };
    const data = await CommonAPINew(body,'264',VERSION)
    
    return data?.Data?.rd || []

}
export const GetReconcilationSummary = async () => {
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "ReconcileSummary"
    }),
    p: "",
    f: "ReconcileSummary"
  };
    const data = await CommonAPINew(body,'264',VERSION)
    
    return data?.Data?.rd || []

}



export const SaveReconciliation = async (RmBags,tolerancefrom,toleranceto,totalweight,trayweight,stickerweight,polytheneweight,systemwt,loginuserid,remarks) => {
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "BulkReconcileSave"
    }),
    p: JSON.stringify({
      rfbags: RmBags,
      tolerancefrom: tolerancefrom,
      toleranceto: toleranceto,
      totalweight: totalweight,
      trayweight: trayweight,
      stickerweight: stickerweight,
      polytheneweight: polytheneweight,
      systemwt: systemwt,
      loginuserid: loginuserid,
      remarks: remarks
    }),
    f: "BulkReconcileSave"
  };

    const data = await CommonAPINew(body,'264',VERSION)
    
     return data?.Data?.rd || []

}
