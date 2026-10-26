import { CommonAPI, CommonAPINew } from "../CommonAPI";

const VERSION =
  window.location.hostname == "localhost" ||
  window.location.hostname == "nzen"
    ? "R50B3"
    : "live";
    let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    
     
// read fresh on every call (NOT once at import time)
const getAuth = () => {
  try {
    return JSON.parse(sessionStorage.getItem("AuthqueryParams")) || {};
  } catch (e) {
    return {};
  }
};

// optional: wait until the uid exists (covers the first-load gap)
const getUid = async (maxMs = 10000) => {
  const t0 = Date.now();
  let uid = getAuth()?.uid;
  while (!uid && Date.now() - t0 < maxMs) {
    await new Promise((r) => setTimeout(r, 100));
    uid = getAuth()?.uid;
  }
  return uid || "";
};
 

export const getMasterMaterialData = async () => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "MasterItemList",
      FormName: "BulkReconcile",
      appuserid: uid,
    }),
    p: JSON.stringify({}),
    f: "MasterItemList",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data || [];
};

export const GetmaterialWiseData = async (MaterialId) => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "InvoiceByMasterItem",
      FormName: "BulkReconcile",
      appuserid: uid,
    }),
    p: JSON.stringify({ master_item_id: MaterialId }),
    f: "InvoiceByMasterItem",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data?.rd || [];
};

export const GetTodaysTransactionData = async (MaterialId) => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "CurrentTransactionRFBags",
      appuserid: uid,
    }),
    p: JSON.stringify({ master_item_id: MaterialId }),
    f: "CurrentTransactionRFBags",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data?.rd || [];
};

export const GetReconcilationSummary = async () => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "ReconcileSummary",
      appuserid: uid,
    }),
    p: "",
    f: "ReconcileSummary",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data?.rd || [];
};

export const SetToReconcile = async (metal, othermaterial) => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "SaveTolerance",
      appuserid: uid,
    }),
    p: JSON.stringify({ metal, othermaterial }),
    f: "SaveTolerance",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data?.rd || [];
};

export const SaveReconciliation = async (RmBags, tolerance, totalweight, systemwt, totalbags, remarks, physicalwt) => {
  const uid = await getUid();
  const body = {
    con: JSON.stringify({
      id: "",
      mode: "BulkReconcileSave",
      appuserid: uid,
    }),
    p: JSON.stringify({
      rfbags: RmBags,
      tolerance,
      totalweight,
      systemwt,
      totalbags,
      remarks,
      physicalwt,
    }),
    f: "BulkReconcileSave",
  };

  const data = await CommonAPINew(body, "264", VERSION);
  return data?.Data?.rd || [];
};