import { CommonAPI, CommonAPINew } from "../CommonAPI";

const VERSION =
    window.location.hostname == "localhost" ||
    window.location.hostname == "nzen"
      ?  "R50B3"
      : "live";
        const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));

export const getMasterMaterialData = async () => {
    const body = {
        con: JSON.stringify({
          id: "",
          mode: "MasterItemList",
          FormName: "BulkReconcile",
          appuserid : AllData?.uid || ""
    
        }),
        p: JSON.stringify({ }),
        f: "MasterItemList"
      };
      
      console.log("TCL: getMasterMaterialData -> AllData",AllData )

      const data = await CommonAPINew(body,'264',VERSION)
      
       return data?.Data || []

}


export const GetmaterialWiseData = async (MaterialId) => {
    const body = {
        con: JSON.stringify({
          id: "",
          mode: "InvoiceByMasterItem",
          FormName: "BulkReconcile",
          appuserid : AllData?.uid || ""
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
      mode: "CurrentTransactionRFBags",
      appuserid : AllData?.uid || ""
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
      mode: "ReconcileSummary",
      appuserid : AllData?.uid || ""
    }),
    p: "",
    f: "ReconcileSummary"
  };
    const data = await CommonAPINew(body,'264',VERSION)
    
    return data?.Data?.rd || []

}


export const SetToReconcile = async (metal,othermaterial) => {
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "SaveTolerance",
      appuserid : AllData?.uid || ""

    
    }),
    p: JSON.stringify({
      metal: metal,
      othermaterial: othermaterial
    }),
    f: "SaveTolerance"
  };
    const data = await CommonAPINew(body,'264',VERSION)
    
    return data?.Data?.rd || []

}



export const SaveReconciliation = async (RmBags,tolerance,totalweight,trayweight,stickerweight,polytheneweight,systemwt,remarks,countBag) => {
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "BulkReconcileSave",
      appuserid : AllData?.uid || ""
    }),
    p: JSON.stringify({
      rfbags: RmBags,
      tolerance: tolerance,
      // tolerancefrom: tolerancefrom,
      // toleranceto: toleranceto,
      totalweight: totalweight,
      trayweight: trayweight,
      stickerweight: stickerweight,
      polytheneweight: polytheneweight,
      systemwt: systemwt,
      remarks: remarks,
      totalbags: countBag
    }),
    f: "BulkReconcileSave"
  };

    const data = await CommonAPINew(body,'264',VERSION)
    
     return data?.Data?.rd || []

}
