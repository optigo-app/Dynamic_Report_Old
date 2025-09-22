// http://localhost:3000/testreport/?sp=9&ifid=ToolsReport&pid=18312
// StockValuation.jsx
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./StockValuation.scss";
import { GetWorkerData } from "../../API/GetWorkerData/GetWorkerData";

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

    // Collect all material IDs from IN and OUT
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

  const toggleGroup = (materialId, type) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [type]: !prev[materialId]?.[type],
      },
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="stock-valuation">
      <h2>Stock Valuation Report</h2>

      <div className="date-picker-container">
        <label>Select Entry Date: </label>
        <DatePicker
          selected={entryDate}
          onChange={(date) => setEntryDate(date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <table className="valuation-table">
        <thead>
          <tr>
            <th></th>
            <th>Item ID</th>
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
          {finalTable.map((row, idx) => (
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
                <td>{row.itemId}</td>
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
                Object.entries(groupByMaterial(row.inRows, row.outRows)).map(
                  ([materialId, { in: inGroup, out: outGroup }], gIdx) => {
                    const materialName = getMaterialName(materialId);
                    const isInExpanded = expandedGroups[materialId]?.in;
                    const isOutExpanded = expandedGroups[materialId]?.out;

                    return (
                      <React.Fragment key={gIdx}>
                        {/* IN Block */}
                        {inGroup.length > 0 && (
                          <>
                            <tr className="expanded-row">
                              <td>
                                <button
                                  onClick={() => toggleGroup(materialId, "in")}
                                >
                                  {isInExpanded ? "−" : "+"}
                                </button>
                              </td>
                              <td colSpan={2}>{materialName} (IN)</td>
                              <td>0.000</td>
                              <td>0.00</td>
                              <td>
                                {inGroup
                                  .reduce((sum, r) => sum + Number(r["5"]), 0)
                                  .toFixed(3)}
                              </td>
                              <td>
                                {inGroup
                                  .reduce((sum, r) => sum + Number(r["8"]), 0)
                                  .toFixed(2)}
                              </td>
                              <td>0.000</td>
                              <td>0.00</td>
                              <td>0.000</td>
                              <td>0.00</td>
                            </tr>
                            {isInExpanded &&
                              inGroup.map((entry, i) => (
                                <tr key={`in-${i}`} className="sub-entry-row">
                                  <td></td>
                                  <td
                                    colSpan={2}
                                    style={{ paddingLeft: "30px" }}
                                  >
                                    {entry["4"]}
                                  </td>
                                  <td>{Number(entry["5"]).toFixed(3)}</td>
                                  <td>{Number(entry["8"]).toFixed(2)}</td>
                                  <td colSpan={5}></td>
                                </tr>
                              ))}
                          </>
                        )}

                        {/* OUT Block */}
                        {outGroup.length > 0 && (
                          <>
                            <tr className="expanded-row">
                              <td>
                                <button
                                  onClick={() => toggleGroup(materialId, "out")}
                                >
                                  {isOutExpanded ? "−" : "+"}
                                </button>
                              </td>
                              <td colSpan={2}>{materialName} (OUT)</td>
                              <td>0.000</td>
                              <td>0.00</td>
                              <td>0.000</td>
                              <td>0.00</td>
                              <td>
                                {outGroup
                                  .reduce((sum, r) => sum + Number(r["5"]), 0)
                                  .toFixed(3)}
                              </td>
                              <td>
                                {outGroup
                                  .reduce((sum, r) => sum + Number(r["8"]), 0)
                                  .toFixed(2)}
                              </td>
                              <td>0.000</td>
                              <td>0.00</td>
                            </tr>
                            {isOutExpanded &&
                              outGroup.map((entry, i) => (
                                <tr key={`out-${i}`} className="sub-entry-row">
                                  <td></td>
                                  <td
                                    colSpan={2}
                                    style={{ paddingLeft: "30px" }}
                                  >
                                    {entry["4"]}
                                  </td>
                                  <td colSpan={4}></td>
                                  <td>{Number(entry["5"]).toFixed(3)}</td>
                                  <td>{Number(entry["8"]).toFixed(2)}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              ))}
                          </>
                        )}
                      </React.Fragment>
                    );
                  }
                )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockValuation;
