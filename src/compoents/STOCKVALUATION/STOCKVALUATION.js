// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18312

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./StockValuation.scss";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { Button, CircularProgress, TextField } from "@mui/material";

const StockValuation = () => {
  const [entryDate, setEntryDate] = useState(new Date());
  const [allInData, setAllInData] = useState([]);
  const [allOutData, setAllOutData] = useState([]);
  const [itemMaster, setItemMaster] = useState([]);
  const [materialMaster, setMaterialMaster] = useState([]);
  const [finalTable, setFinalTable] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJobworkModal, setShowJobworkModal] = useState(false);
  const [jobworkData, setJobworkData] = useState([]);
  const [jobworkDataTotal, setJobworkDataTotal] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [metalTypeMaster, setMetalTypeMaster] = useState([]);
  const [openingData, setOpeningData] = useState([]);
  const [redirectData, setRedirectData] = useState();

  const formatToUTCYYYYMMDD = (dateInput) => {
    const date = new Date(dateInput);
    return date.toISOString().split("T")[0];
  };

  const fetchAllData = async () => {
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = new URLSearchParams(window.location.search).get("sp");

    try {
      const [inRes, outRes, masterRes, redirectDataApi] = await Promise.all([
        GetWorkerData(
          {
            con: `{"id":"","mode":"STOCK_VALUATION_IN","appuserid":"${AllData?.uid}"}`,
            p: "",
            f: "Task Management (taskmaster)",
          },
          sp
        ),
        GetWorkerData(
          {
            con: `{"id":"","mode":"STOCK_VALUATION_OUT","appuserid":"${AllData?.uid}"}`,
            p: "",
            f: "Task Management (taskmaster)",
          },
          sp
        ),
        GetWorkerData(
          {
            con: `{"id":"","mode":"stockvaluation_master","appuserid":"${AllData?.uid}"}`,
            p: "",
            f: "Task Management (taskmaster)",
          },
          sp
        ),
        GetWorkerData(
          {
            con: `{"id":"","mode":"redirect_stockvaluation","appuserid":"${AllData?.uid}"}`,
            p: "",
            f: "Task Management (taskmaster)",
          },
          sp
        ),
      ]);

      setAllInData(inRes?.Data?.rd1 || []);
      setAllOutData(outRes?.Data?.rd1 || []);
      setItemMaster(masterRes?.Data?.rd || []);
      setMaterialMaster(masterRes?.Data?.rd1 || []);
      setMetalTypeMaster(masterRes?.Data?.rd19 || []);
      setRedirectData(redirectDataApi?.Data?.rd[0]);
      setModalLoading(false);
    } catch (err) {
      console.error("API Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
      const sp = new URLSearchParams(window.location.search).get("sp");

      const day = String(entryDate.getDate()).padStart(2, "0");
      const month = String(entryDate.getMonth() + 1).padStart(2, "0");
      const year = entryDate.getFullYear();
      const formattedDate = `${month}/${day}/${year}`;

      try {
        const [Opening] = await Promise.all([
          GetWorkerData(
            {
              con: `{"id":"","mode":"STOCK_VALUATION_OPENING","appuserid":"${AllData?.uid}"}`,
              p: `{"fdate":"${formattedDate}"}`,
              f: "Task Management (taskmaster)",
            },
            sp
          ),
        ]);
        setOpeningData(Opening?.Data || []);
      } catch (err) {
        console.error("API Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [entryDate]);

  useEffect(() => {
    if (!loading) {
      const selectedDate = formatToUTCYYYYMMDD(entryDate);

      const filteredIn = allInData.filter(
        (x) => formatToUTCYYYYMMDD(x["1"]) === selectedDate
      );
      const filteredOut = allOutData.filter(
        (x) => formatToUTCYYYYMMDD(x["1"]) === selectedDate
      );

      const combinedItemIds = new Set([
        ...filteredIn.map((x) => x["17"]),
        ...filteredOut.map((x) => x["17"]),
        ...(openingData?.rd1 || []).map((op) => op["1"]),
      ]);

      const openingRows = openingData?.rd1 || [];

      const table = [...combinedItemIds].map((itemId) => {
        const itemRow = itemMaster.find((i) => i.id === Number(itemId));
        const itemName = normalizeItemName(itemRow?.itemname || "Unknown");

        const inRows = filteredIn.filter((r) => r["17"] == itemId);
        const outRows = filteredOut.filter((r) => r["17"] == itemId);

        const matchedOpeningRows = openingRows.filter(
          (op) => op["1"] == itemId
        );
        const isCustomerRow = (r) => r["20"] === "Customer";

        const openingWeight = matchedOpeningRows.reduce(
          (sum, r) => sum + (isCustomerRow(r) ? 0 : Number(r["6"] || 0)),
          0
        );

        const openingAmount = matchedOpeningRows.reduce(
          (sum, r) => sum + (isCustomerRow(r) ? 0 : Number(r["10"] || 0)),
          0
        );

        const inWeight = inRows.reduce(
          (sum, r) =>
            sum +
            (isCustomerRow(r)
              ? 0
              : r["17"] == 4 || r["17"] == 3 || r["17"] == 7
                ? Number(r["5"] || 0)
                : Number(r["19"] || 0)),
          0
        );

        const inAmount = inRows.reduce(
          (sum, r) => sum + (isCustomerRow(r) ? 0 : Number(r["8"] || 0)),
          0
        );

        const outWeight = outRows.reduce(
          (sum, r) =>
            sum +
            (r["17"] == 4 || r["17"] == 3 || r["17"] == 7 || r["17"] == 6
              ? Number(r["5"] || 0)
              : Number(r["19"] || 0)),
          0
        );

        const outAmount = outRows.reduce(
          (sum, r) => sum + Number(r["8"] || 0),
          0
        );

        const closingWeight = openingWeight + inWeight - outWeight;
        const closingAmount = openingAmount + inAmount - outAmount;

        return {
          itemId,
          itemName,
          openingWeight,
          openingAmount,
          inWeight,
          inAmount,
          outWeight,
          outAmount,
          closingWeight,
          closingAmount,
          inRows,
          outRows,
        };
      });
      setFinalTable(table);
    }
  }, [entryDate, allInData, allOutData, itemMaster, openingData]);

  const handleMetalClick = async () => {
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = new URLSearchParams(window.location.search).get("sp");

    const day = String(entryDate.getDate()).padStart(2, "0");
    const month = String(entryDate.getMonth() + 1).padStart(2, "0");
    const year = entryDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    setModalLoading(true);
    try {
      const res = await GetWorkerData(
        {
          con: `{"id":"","mode":"STOCK_VALUATION_JOBWORK","appuserid":"${AllData?.uid}"}`,
          p: `{"fdate":"${formattedDate}"}`,
          f: "Task Management (taskmaster)",
        },
        sp
      );

      setJobworkData(res?.Data?.rd || []);
      setJobworkDataTotal(res?.Data?.rd1 || []);
      setShowJobworkModal(true);
    } catch (err) {
      console.error("Error fetching jobwork data", err);
    } finally {
      setModalLoading(false);
    }
  };

  const getMaterialName = (id) => {
    return (
      materialMaster.find((m) => m.materialtypeid === Number(id))
        ?.materialtypename || `NATURAL`
    );
  };

  const getMetalTypeName = (id) => {
    return (
      metalTypeMaster.find((m) => m.metaltypeid === Number(id))?.metaltype ||
      `ID: ${id}`
    );
  };

  const groupByShape = (inRows, outRows) => {
    const groups = {};
    const shapeIds = new Set([
      ...inRows.map((r) => r["10"]),
      ...outRows.map((r) => r["10"]),
    ]);

    shapeIds.forEach((shapeId) => {
      groups[shapeId] = {
        in: inRows.filter((r) => r["10"] === shapeId),
        out: outRows.filter((r) => r["10"] === shapeId),
      };
    });
    return groups;
  };

  const groupByMaterial = (inRows, outRows) => {
    const groups = {};
    const materialIds = new Set([
      ...inRows.map((r) => r["9"]),
      ...outRows.map((r) => r["9"]),
    ]);

    materialIds.forEach((materialId) => {
      groups[materialId] = {
        in: inRows.filter((r) => r["9"] === materialId),
        out: outRows.filter((r) => r["9"] === materialId),
      };
    });

    return groups;
  };

  const hanldeNaviagte = (itemName, materialName, data, materialId) => {
    console.log("new call");

    let itemParam = itemName === "COLORSTONE" ? "COLOR STONE" : itemName;
    let materialParam =
      materialId === 0 || materialId == null ? "" : materialName;
    const payload = {
      entryDate: entryDate ? entryDate.toISOString() : null,
      itemName: itemParam,
      materialName: materialParam,
      materialId: materialId,
    };
    console.log("payload", payload);
    try {
      sessionStorage.setItem("closingReportParams", JSON.stringify(payload));
    } catch (err) {
      console.warn("Unable to write sessionStorage:", err);
    }

    if (window?.parent?.postMessage) {
      window.parent.postMessage(
        {
          type: "ADD_TAB",
          evt: "DynamicReportOld",
          payload: {
            TabName: "Closing Stock Report",
            TabUrl: redirectData?.ReportRedirectUrl,
          },
        },
        "*"
      );
    }
  };

  //  const hanldeNaviagte = (itemName, materialName, data, materialId) => {
  //   const url_optigo = "http://nzen/";
  //   const pid = "18369";
  //   let itemParam = itemName === "COLORSTONE" ? "COLOR STONE" : itemName;
  //   let materialParam =
  //     materialId === 0 || materialId == null ? "" : materialName;
  //   const payload = {
  //     entryDate: entryDate ? entryDate.toISOString() : null,
  //     itemName: itemParam,
  //     materialName: materialParam,
  //     materialId: materialId,
  //   };
  //   console.log("payload", payload);
  //   try {
  //     sessionStorage.setItem("closingReportParams", JSON.stringify(payload));
  //   } catch (err) {
  //     console.warn("Unable to write sessionStorage:", err);
  //   }
  //   const finalUrl = `${url_optigo}testreport/?sp=9&ifid=ClosingStockReport&pid=${pid}`;
  //   // window.parent.addTab("Closing Stock Report", "icon-StockDetail", finalUrl);
  //   if (window?.parent?.postMessage) {
  //     window.parent.postMessage(
  //       {
  //         type: "ADD_TAB",
  //         evt: "DynamicReportOld",
  //         payload: {
  //           TabName: "Closing Stock Report",
  //           TabUrl: redirectData?.ReportRedirectUrl,
  //         },
  //       },
  //       "*"
  //     );
  //   }
  // };

  const orderMap = {
    METAL: 1,
    DIAMOND: 2,
    COLORSTONE: 3,
    MISC: 4,
    FINDING: 5,
    ALLOY: 6,
    MOUNT: 7,
  };

  const normalizeItemName = (rawName) => {
    const name = rawName?.trim().toUpperCase().replace(/\s+/g, "");
    const map = {
      METAL: "METAL",
      DIAMOND: "DIAMOND",
      COLORSTONE: "COLORSTONE",
      COLOSRTOEN: "COLORSTONE", // your spelling mistake
      COLORESTONE: "COLORSTONE",
      COLORSTN: "COLORSTONE",
      COLORST: "COLORSTONE",
      MISC: "MISC",
      MISCELLANEOUS: "MISC",
      FINDING: "FINDING",
      FINDIND: "FINDING", // your spelling mistake
      ALLOY: "ALLOY",
      ALLOW: "ALLOY", // your spelling mistake
      MOUNT: "MOUNT",
    };

    return map[name] || rawName;
  };

  const removeCustomerRows = (rows = []) =>
    rows.filter((r) => r["20"] !== "Customer");

  const cleanedFinalTable = (finalTable || []).map((item) => ({
    ...item,
    inRows: removeCustomerRows(item.inRows),
    outRows: removeCustomerRows(item.outRows),
  }));

  const sortedFinalTable = [...cleanedFinalTable].sort((a, b) => {
    const orderA = orderMap[a.itemName.toUpperCase()] ?? 999;
    const orderB = orderMap[b.itemName.toUpperCase()] ?? 999;
    return orderA - orderB;
  });

  const handleStockCal = async () => {
    setModalLoading(true);
    const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
    const sp = new URLSearchParams(window.location.search).get("sp");

    try {
      const [stockCal] = await Promise.all([
        GetWorkerData(
          {
            con: `{"id":"","mode":"calc_stockvaluation","appuserid":"${AllData?.uid}"}`,
            p: "",
            f: "Task Management (taskmaster)",
          },
          sp
        ),
      ]);

      console.log("stockCal", stockCal?.Data?.rd[0]?.stat, stockCal);
      if (stockCal?.Data?.rd[0]?.stat == 1) {
        fetchAllData();
      }
    } catch (err) {
      console.error("API Error", err);
    }
  };

  console.log("sortedFinalTable", sortedFinalTable);

  return (
    <div className="stock-valuation">
      {loading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}

      {/* ── Summary Bar ── */}
      {!loading && !modalLoading && (
        <div style={{
          padding: "12px 0 16px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: 14
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
            marginBottom: 10
          }}>
            {["METAL", "DIAMOND", "COLORSTONE", "MISC", "FINDING", "MOUNT"].map((name) => {
              const row = sortedFinalTable.find((r) => r.itemName === name);
              return (
                <div key={name} style={{
                  background: "#f5f5f5",
                  borderRadius: 8,
                  padding: "10px 14px"
                }}>
                  <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 4 }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>
                    {row ? row.closingWeight.toFixed(3) : "0.000"}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    ₹ {row ? row.closingAmount.toFixed(2) : "0.00"}
                  </div>
                </div>
              );
            })}

            {/* Total Amount card inline */}
            <div style={{
              background: "#f5f5f5",
              borderRadius: 8,
              padding: "10px 14px"
            }}>
              <div style={{ fontSize: 12, color: "#888", fontWeight: 500, marginBottom: 4 }}>
                TOTAL AMOUNT
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                ₹ {sortedFinalTable.reduce((sum, r) => sum + r.closingAmount, 0).toFixed(2)}
              </div>
            </div>

          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <label>Select Entry Date: </label>
          <DatePicker
            selected={entryDate}
            onChange={(date) => setEntryDate(date)}
            maxDate={new Date()} // ✅ restrict future dates
            dateFormat="dd-MM-yyyy"
            customInput={
              <TextField
                label="Select Date"
                variant="outlined"
                fullWidth
                size="small"
              />
            }
          />
        </div>
        <Button
          onClick={handleStockCal}
          style={{
            backgroundColor: "#5e5eef",
            color: "white",
          }}
        >
          Calculate
        </Button>
      </div>

      <div style={{ height: "80vh", overflow: "auto" }}>
        <table className="valuation-table">
          <thead>
            <tr>
              <th></th>
              <th>Item Name</th>
              <th>Opening Weight</th>
              <th>Opening Amount</th>
              <th>IN Weight</th>
              <th>IN Amount</th>
              <th>OUT Weight</th>
              <th>OUT Amount</th>
              <th>Closing Weight</th>
              <th>Closing Amount</th>
            </tr>
          </thead>
          {modalLoading ? (
            <tbody>
              <tr>
                <td colSpan={10}>
                  <div className="loader-center">
                    <CircularProgress />
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {sortedFinalTable?.map((row, idx) => {
                let combinedGroups = [
                  "METAL",
                  "FINDING",
                  "MOUNT",
                  "ALLOY",
                ].includes(row.itemName)
                  ? groupByShape(row.inRows, row.outRows)
                  : groupByMaterial(row.inRows, row.outRows);

                // Ensure groups have opening[]
                Object.keys(combinedGroups).forEach((k) => {
                  if (!combinedGroups[k].opening) {
                    combinedGroups[k].opening = [];
                  }
                });
                const openingRowsForItem = (openingData?.rd1 || []).filter(
                  (op) => op["1"] == row.itemId
                );
                openingRowsForItem.forEach((op) => {
                  const rawKey = [
                    "METAL",
                    "FINDING",
                    "MOUNT",
                    "ALLOY",
                  ].includes(row.itemName)
                    ? op["2"] || 0
                    : op["8"] || 0;
                  const key = rawKey ? String(rawKey) : "0"; // Safe key
                  if (!combinedGroups[key]) {
                    combinedGroups[key] = { opening: [], in: [], out: [] };
                  }
                  if (!combinedGroups[key].opening) {
                    combinedGroups[key].opening = [];
                  }
                  combinedGroups[key].opening.push(op); // SAFE
                });

                if (Object.keys(combinedGroups).length === 0) {
                  const openingGroups = {};
                  (openingData?.rd1 || []).forEach((op) => {
                    if (op["1"] == row.itemId) {
                      const rawKey = [
                        "METAL",
                        "FINDING",
                        "MOUNT",
                        "ALLOY",
                      ].includes(row.itemName)
                        ? op["2"] || 0
                        : op["8"] || 0;
                      const key = rawKey ? String(rawKey) : "0";
                      if (!openingGroups[key]) {
                        openingGroups[key] = { in: [], out: [], opening: [] };
                      }
                      openingGroups[key].opening.push(op);
                    }
                  });
                  combinedGroups = openingGroups;
                }
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td>
                        <button
                          onClick={() =>
                            setExpandedItemId(
                              expandedItemId === row.itemId ? null : row.itemId
                            )
                          }
                        >
                          {expandedItemId === row.itemId ? "−" : "+"}
                        </button>
                      </td>

                      {row?.itemName === "METAL" ? (
                        <td
                          style={{
                            color: "blue",
                            textDecoration: "underline",
                            cursor: "pointer",
                          }}
                          onClick={handleMetalClick}
                        >
                          {row.itemName}
                        </td>
                      ) : (
                        <td>{row.itemName}</td>
                      )}

                      <td>{row.openingWeight.toFixed(3)}</td>
                      <td>{row.openingAmount.toFixed(2)}</td>
                      <td>{row.inWeight.toFixed(3)}</td>
                      <td>{row.inAmount.toFixed(2)}</td>
                      <td>{row.outWeight.toFixed(3)}</td>
                      <td>{row.outAmount.toFixed(2)}</td>
                      <td>{row.closingWeight.toFixed(3)}</td>
                      <td>{row.closingAmount.toFixed(2)}</td>
                    </tr>

                    {expandedItemId === row.itemId &&
                      Object.entries(combinedGroups).map(
                        ([materialId, group], gIdx) => {
                          const materialName = [
                            "METAL",
                            "FINDING",
                            "MOUNT",
                            "ALLOY",
                          ].includes(row.itemName)
                            ? materialId > 0
                              ? getMetalTypeName(materialId)
                              : row.itemName
                            : materialId > 0
                              ? getMaterialName(materialId)
                              : row.itemName;

                          const groupOpeningWeight =
                            group.opening?.reduce(
                              (sum, r) => sum + Number(r["6"] || 0),
                              0
                            ) || 0;
                          const groupOpeningAmt =
                            group.opening?.reduce(
                              (sum, r) => sum + Number(r["10"] || 0),
                              0
                            ) || 0;
                          const inWeight =
                            group.in?.reduce(
                              (sum, r) => sum + Number(r["19"] || r["5"] || 0),
                              0
                            ) || 0;
                          const inAmount =
                            group.in?.reduce(
                              (sum, r) => sum + Number(r["8"] || 0),
                              0
                            ) || 0;
                          const outWeight =
                            group.out?.reduce(
                              (sum, r) => sum + Number(r["19"] || r["5"] || 0),
                              0
                            ) || 0;
                          const outAmount =
                            group.out?.reduce(
                              (sum, r) => sum + Number(r["8"] || 0),
                              0
                            ) || 0;
                          const closingWeight =
                            groupOpeningWeight + inWeight - outWeight;

                          const closingAmount =
                            groupOpeningAmt + inAmount - outAmount;
                          return (
                            <tr className="expanded-row" key={gIdx}>
                              <td></td>
                              <td
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  hanldeNaviagte(
                                    row.itemName,
                                    materialName,
                                    row,
                                    materialId
                                  )
                                }
                              >
                                {materialName}
                              </td>
                              <td>{groupOpeningWeight.toFixed(3)}</td>
                              <td>{groupOpeningAmt.toFixed(2)}</td>
                              <td>{inWeight.toFixed(3)}</td>
                              <td>{inAmount.toFixed(2)}</td>
                              <td>{outWeight.toFixed(3)}</td>
                              <td>{outAmount.toFixed(2)}</td>
                              <td>{closingWeight.toFixed(3)}</td>
                              <td>{closingAmount.toFixed(2)}</td>
                            </tr>
                          );
                        }
                      )}
                  </React.Fragment>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {showJobworkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {" "}
              {entryDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </h3>
            <button
              className="close-btn"
              onClick={() => setShowJobworkModal(false)}
            >
              ×
            </button>

            {modalLoading ? (
              <div className="loader-center">
                <CircularProgress />
              </div>
            ) : (
              <table className="jobwork-table">
                <thead>
                  <tr>
                    <th>Detail</th>
                    <th>Gold Weight</th>
                    <th>Silver Weight</th>
                    <th>Platinum Weight</th>
                    <th>Other Weight</th>
                  </tr>
                </thead>

                <tbody>
                  {(() => {
                    const totalStock = jobworkDataTotal[0] || {
                      goldwt: 0,
                      silverwt: 0,
                      platinumwt: 0,
                      otherwt: 0,
                    };
                    const customerTotals = jobworkData.reduce(
                      (acc, r) => ({
                        goldwt: acc.goldwt + Number(r.goldwt || 0),
                        silverwt: acc.silverwt + Number(r.silverwt || 0),
                        platinumwt: acc.platinumwt + Number(r.platinumwt || 0),
                        otherwt: acc.otherwt + Number(r.otherwt || 0),
                      }),
                      { goldwt: 0, silverwt: 0, platinumwt: 0, otherwt: 0 }
                    );

                    const companyStock = {
                      goldwt: totalStock.goldwt - customerTotals.goldwt,
                      silverwt: totalStock.silverwt - customerTotals.silverwt,
                      platinumwt:
                        totalStock.platinumwt - customerTotals.platinumwt,
                      otherwt: totalStock.otherwt - customerTotals.otherwt,
                    };

                    return (
                      <>
                        <tr>
                          <td>{totalStock.eventname || "Total Stock (+)"}</td>
                          <td>{Number(totalStock.goldwt || 0).toFixed(3)}</td>
                          <td>{Number(totalStock.silverwt || 0).toFixed(3)}</td>
                          <td>
                            {Number(totalStock.platinumwt || 0).toFixed(3)}
                          </td>
                          <td>{Number(totalStock.otherwt || 0).toFixed(3)}</td>
                        </tr>

                        {jobworkData.length > 0 ? (
                          jobworkData.map((row, i) => (
                            <tr key={i}>
                              <td>{row.eventname} (-)</td>
                              <td>{Number(row.goldwt || 0).toFixed(3)}</td>
                              <td>{Number(row.silverwt || 0).toFixed(3)}</td>
                              <td>{Number(row.platinumwt || 0).toFixed(3)}</td>
                              <td>{Number(row.otherwt || 0).toFixed(3)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center" }}>
                              No data available
                            </td>
                          </tr>
                        )}

                        {/* Company Stock row */}
                        <tr style={{ background: "#f3f3f3" }}>
                          <td>Company Stock</td>
                          <td style={{ fontWeight: 600 }}>
                            {companyStock.goldwt.toFixed(3)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {companyStock.silverwt.toFixed(3)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {companyStock.platinumwt.toFixed(3)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {companyStock.otherwt.toFixed(3)}
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockValuation;
