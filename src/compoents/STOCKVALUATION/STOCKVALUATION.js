// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18312

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./StockValuation.scss";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";
import { CircularProgress, TextField } from "@mui/material";

const StockValuation = () => {
  const [entryDate, setEntryDate] = useState(new Date());
  const [allInData, setAllInData] = useState([]);
  const [allOutData, setAllOutData] = useState([]);
  const [itemMaster, setItemMaster] = useState([]);
  const [materialMaster, setMaterialMaster] = useState([]);
  const [finalTable, setFinalTable] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loading, setLoading] = useState(true);

  const formatToUTCYYYYMMDD = (dateInput) => {
    const date = new Date(dateInput);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchAllData = async () => {
      const AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
      const sp = new URLSearchParams(window.location.search).get("sp");

      try {
        const [inRes, outRes, masterRes] = await Promise.all([
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
        ]);

        setAllInData(inRes?.Data?.rd1 || []);
        setAllOutData(outRes?.Data?.rd1 || []);
        setItemMaster(masterRes?.Data?.rd || []);
        setMaterialMaster(masterRes?.Data?.rd1 || []);
      } catch (err) {
        console.error("API Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

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
      ]);

      const table = [...combinedItemIds].map((itemId) => {
        const itemRow = itemMaster.find((i) => i.id === Number(itemId));
        const itemName = itemRow?.itemname || "Unknown";

        const inRows = filteredIn.filter((r) => r["17"] == itemId);
        const outRows = filteredOut.filter((r) => r["17"] == itemId);

        return {
          itemId,
          itemName,
          openingWeight: 0.0,
          openingAmount: 0.0,
          inWeight: inRows.reduce((sum, r) => sum + Number(r["5"]), 0),
          inAmount: inRows.reduce((sum, r) => sum + Number(r["8"]), 0),
          outWeight: outRows.reduce((sum, r) => sum + Number(r["5"]), 0),
          outAmount: outRows.reduce((sum, r) => sum + Number(r["8"]), 0),
          closingWeight: 0.0,
          closingAmount: 0.0,
          inRows,
          outRows,
        };
      });

      setFinalTable(table);
    }
  }, [entryDate, allInData, allOutData, itemMaster]);

  const getMaterialName = (id) => {
    return (
      materialMaster.find((m) => m.materialtypeid === Number(id))
        ?.materialtypename || `ID: ${id}`
    );
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

  const groupByNarration = (rows) => {
    const grouped = {};
    rows.forEach((r) => {
      const key = r["4"];
      if (!grouped[key]) {
        grouped[key] = { weight: 0, amount: 0 };
      }
      grouped[key].weight += Number(r["5"]);
      grouped[key].amount += Number(r["8"]);
    });
    return grouped;
  };

  const toggleGroup = (materialId, type) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [type]: !prev[materialId]?.[type],
      },
    }));
  };

  const hanldeNaviagte = (material, indata) => {
    let url_optigo = "http://nzen/";
    const pid = "18316";
    const dateParam = encodeURIComponent(entryDate.toISOString());

    window.parent.addTab(
      "Stock Detail",
      "icon-StockDetail",
      `${url_optigo}testreport/?sp=9&ifid=StockDetail&pid=${pid}&material=${encodeURIComponent(
        material
      )}&inData=${indata}&entryDate=${dateParam}`
    );
  };

  return (
    <div className="stock-valuation">
      {loading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}
      <div
        className="date-picker-container"
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <label>Select Entry Date: </label>
        <DatePicker
          selected={entryDate}
          onChange={(date) => setEntryDate(date)}
          dateFormat="yyyy-MM-dd"
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

      <table className="valuation-table">
        <thead>
          <tr>
            <th></th>
            {/* <th>Item ID</th> */}
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
        <tbody>
          {finalTable.map((row, idx) => {
            const combinedGroups = groupByMaterial(row.inRows, row.outRows);
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
                  {/* <td>{row.itemId}</td> */}
                  <td>{row.itemName}</td>
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
                      const materialName = getMaterialName(materialId);
                      const isExpanded = expandedGroups[materialId]?.merged;

                      return (
                        <React.Fragment key={gIdx}>
                          <tr className="expanded-row">
                            <td>
                              <button
                                onClick={() =>
                                  toggleGroup(materialId, "merged")
                                }
                              >
                                {isExpanded ? "−" : "+"}
                              </button>
                            </td>
                            <td colSpan={2}>{materialName}</td>
                            <td>0.000</td>
                            <td>0.00</td>
                            <td>
                              {group.in
                                .reduce((sum, r) => sum + Number(r["5"]), 0)
                                .toFixed(3)}
                            </td>
                            <td>
                              {group.in
                                .reduce((sum, r) => sum + Number(r["8"]), 0)
                                .toFixed(2)}
                            </td>
                            <td>
                              {group.out
                                .reduce((sum, r) => sum + Number(r["5"]), 0)
                                .toFixed(3)}
                            </td>
                            <td>
                              {group.out
                                .reduce((sum, r) => sum + Number(r["8"]), 0)
                                .toFixed(2)}
                            </td>
                            <td>0.000</td>
                            <td>0.00</td>
                          </tr>

                          {isExpanded &&
                            (() => {
                              const groupedIN = groupByNarration(group.in);
                              const groupedOUT = groupByNarration(group.out);

                              return (
                                <>
                                  {Object.entries(groupedIN).map(
                                    ([narration, val], i) => (
                                      <tr
                                        key={`in-${i}`}
                                        className="sub-entry-row"
                                      >
                                        <td></td>
                                        <td
                                          colSpan={2}
                                          style={{
                                            paddingLeft: "30px",
                                            color: "blue",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                          }}
                                          onClick={() =>
                                            hanldeNaviagte(narration, true)
                                          }
                                        >
                                          (+) {narration}
                                        </td>
                                        <td>{val.weight.toFixed(3)}</td>
                                        <td>{val.amount.toFixed(2)}</td>
                                        <td colSpan={5}></td>
                                      </tr>
                                    )
                                  )}
                                  {Object.entries(groupedOUT).map(
                                    ([narration, val], i) => (
                                      <tr
                                        key={`out-${i}`}
                                        className="sub-entry-row"
                                      >
                                        <td></td>
                                        <td
                                          colSpan={2}
                                          style={{
                                            paddingLeft: "30px",
                                            color: "blue",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                          }}
                                          onClick={() =>
                                            hanldeNaviagte(narration, false)
                                          }
                                        >
                                          (-) {narration}
                                        </td>
                                        <td>{val.weight.toFixed(3)}</td>
                                        <td>{val.amount.toFixed(2)}</td>
                                        <td colSpan={2}></td>
                                      </tr>
                                    )
                                  )}
                                </>
                              );
                            })()}
                        </React.Fragment>
                      );
                    }
                  )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockValuation;
