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
