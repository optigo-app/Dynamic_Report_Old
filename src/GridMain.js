import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GetToken } from "./API/GetToken";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import Spliter from "./compoents/WorkerReportSpliterView/Spliter";
import DustCollector from "./compoents/DustCollector/DustCollector";
import ToolReport from "./compoents/ToolReport/ToolReport";
import MFGReturnJob from "./compoents/MFGReturnJob/MFGReturnJob";
import ConversionDeatil from "./compoents/ConversionDeatil/ConversionDeatil";
import FinishGoodsReport from "./compoents/FinishGoodsReport/FinishGoodsReport";
import MaterialWiseSaleReport from "./compoents/MaterialWiseSaleReport/MaterialWiseSaleReport";
import StcokReport from "./compoents/StcokReport/StcokReport";
import DeviceSpliter from "./compoents/DeviceManagementReport/DeviceSpliter";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import JobCompletion from "./compoents/JobCompletion/JobCompletion";
import { AlertTriangle } from "lucide-react";
import EmployeeDepartmentReportSpliter from "./compoents/EmployeeDepartmentReport/EmployeeDepartmentReportSpliter";
import OSRReportSpliter from "./compoents/OSRReport/OSRReportSpliter";
import ItaskReport from "./compoents/ItaskReport/ItaskReport";
import FgSpliter from "./compoents/FgWiseWorkerReportSpliterView/FgSpliter";
import RefiningReport from "./compoents/LossRefiningReport/LossRefiningReport";
import LossRefiningReport from "./compoents/LossRefiningReport/LossRefiningReport";
import MaterialWiseWIP from "./compoents/MaterialWiseWIP/MaterialWiseWIP";
import CustomerReceiveReport from "./compoents/CustomerReceiveReport/CustomerReceiveReport";
import CustomerReturnReport from "./compoents/CustomerReturnReport/CustomerReturnReport";
import SignageDisplayList from "./compoents/SignageDisplayList/SignageDisplayList";
import MaterialPurhcaseReturnReport from "./compoents/MaterialPurhcaseReturnReport/MaterialPurhcaseReturnReport";
import Materialmemoreport from "./compoents/MaterialMemoReport/MaterialMemoReport";
import MaterialSaleReport from "./compoents/MaterialSaleReport/MaterialSaleReport";
import MaterialPurhcaseReport from "./compoents/MaterialPurhcaseReport/MaterialPurhcaseReport";
import STOCKVALUATION from "./compoents/STOCKVALUATION/STOCKVALUATION";
import StockDetailIN from "./compoents/StockDetail/StockDetailIN/StockDetailIN";
import StockMain from "./compoents/StockDetail/StockMain";
import StockDetailINTemp from "./compoents/StockDetailTemp/StockDetailINTemp/StockDetailINTemp";
import StockDetailOUTTemp from "./compoents/StockDetailTemp/StockDetailOUTTemp/StockDetailOUTTemp";
import NewFirstSample from "./compoents/AA_NewSampleReport/NewFirstSample";
import StockDetailBothTemp from "./compoents/StockDetailBothTemp/StockDetailBothTemp/StockDetailBothTemp";
import AdvnaceWipReport from "./compoents/AdvnaceWipReport/AdvnaceWipReport";
import CrmReport from "./compoents/CrmReport/CrmReport";
import WebsiteManagementGrid from "./compoents/WebsiteManagementGrid/WebsiteManagementGrid";
import CombinationMaker from "./compoents/CombinationMaker/CombinationMaker";

// Test73  :-    http://nzen/testreport/?sv=/e3tsaXZlLm9wdGlnb2FwcHMuY29tfX17ezIwfX17e3Rlc3Q3M319e3t0ZXN0NzN9fQ==/1&ifid=WorkerReportPro&pid=18223
// http://localhost:3000/testreport/?sv=/e3tsaXZlLm9wdGlnb2FwcHMuY29tfX17ezIwfX17e3Rlc3Q3M319e3t0ZXN0NzN9fQ==/1&ifid=WorkerReportPro&pid=18223

const GridMain = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [tokenMissing, setTokenMissing] = useState(false); // NEW
  const [searchParams] = useSearchParams();
  const pid = searchParams.get("pid");

  const getQueryParams = () => {
    const token = Cookies.get("skey");
    const decoded = jwtDecode(token);
    const Token = sessionStorage.getItem("Token");

    const decodedPayload = {
      ...decoded,
      uid: decodeBase64(decoded.uid),
    };
    if (decodedPayload) {
      sessionStorage.setItem("AuthqueryParams", JSON.stringify(decodedPayload));
    }
    if (!Token) {
      fetchData(decoded);
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cookies.set(
    //   "skey",
    //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6ImMzZGhiV2xBWldjdVkyOXQiLCJleHAiOjE3NjQ1OTc5OTUsInVpZCI6ImMzZGhiV2xBWldjdVkyOXQiLCJ5YyI6ImUzdHVlbVZ1ZlgxN2V6SXdmWDE3ZTI5eVlXbHNNalY5Zlh0N2IzSmhhV3d5TlgxOSIsInN2IjoiMCIsImF0ayI6ImRHOXJaVzVmYzJWamNtVjBYMnRsZVY5dGFXRnZjbUU9IiwiY3V2ZXIiOiJSNTBCMyJ9.lTqmepM3HQJuNQXeArm-gmx9TwL0fFLDzDsoPCqYxcs"
    // );

    //StockValue
    //    Cookies.set(
    //   "skey",
    //    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6ImMzZGhiV2xBWldjdVkyOXQiLCJleHAiOjE3NjI5NDIyNjYsInVpZCI6ImMzZGhiV2xBWldjdVkyOXQiLCJ5YyI6ImUzdHVlbVZ1ZlgxN2V6SXdmWDE3ZTNOMGIyTnJkbUZzZFdWOWZYdDdjM1J2WTJ0MllXeDFaWDE5Iiwic3YiOiIwIn0.AM4wrOzQOItwsf0WP2vKqkNRbLZmkjkJSm_wOlm8R2g"  //stock valu
    // );

    //astore
    // Cookies.set(
    //   "skey",
    //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6ImRuTm5RR1ZuTG1OdmJRPT0iLCJleHAiOjE3NjQxMzk2MTEsInVpZCI6ImRuTm5RR1ZuTG1OdmJRPT0iLCJ5YyI6ImUzdHNhWFpsTG05d2RHbG5iMkZ3Y0hNdVkyOXRmWDE3ZXpJd2ZYMTdlMkZ6ZEc5eVpYMTllM3RoYzNSdmNtVjlmUT09Iiwic3YiOiIxIn0.aufiRoPxEZoIbMEccdnvDDs9wvI-L_eQWamm8sPViFM"
    // );
    const interval = setInterval(() => {
      const token = Cookies.get("skey");
      if (!token) {
        setTokenMissing(true);
      }
    }, 500);
    const token = Cookies.get("skey");
    if (token) {
      getQueryParams();
    } else {
      console.warn("Token cookie not found initially");
      setTokenMissing(true);
      setIsLoading(false);
    }
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   Cookies.set(
  //    "skey",
  //    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJpdGFzayIsImF1ZCI6ImFtVnVhWE5BWldjdVkyOXQiLCJleHAiOjE3NDU5MTEwNDcsInVpZCI6ImFtVnVhWE5BWldjdVkyOXQiLCJ5YyI6ImUzdHVlbVZ1ZlgxN2V6SXdmWDE3ZTI5eVlXbHNNalY5Zlh0N2IzSmhhV3d5TlgxOSIsInN2IjoiMCJ9.9n0tGL-CArkbq3sn0Bfh17xZC7sgubAOWaHDe7rl25w"
  //  );
  //   const token = Cookies.get("skey");
  //   if (token) {
  //     getQueryParams();
  //   } else {
  //     console.warn("Token cookie not found");
  //   }
  // }, []);

  const decodeBase64 = (str) => {
    if (!str) return null;
    try {
      return atob(str);
    } catch (e) {
      console.error("Error decoding base64:", e);
      return null;
    }
  };

  const fetchData = async (decoded) => {
    const sp = searchParams.get("sp");
    if (decoded) {
      const tokenPayload = {
        con: '{"id":"","mode":"gettoken"}',
        p: "{}",
        f: "m-test2.orail.co.in (ConversionDetail)",
      };
      try {
        const tokenResponse = await GetToken(
          tokenPayload,
          decoded?.yc,
          decoded?.sv,
          sp
        );
        const token = tokenResponse?.Data?.rd?.[0]?.token;
        const url_optigo = tokenResponse?.Data?.rd?.[0]?.url_optigo;
        if (token) {
          sessionStorage.setItem("Token", token);
          sessionStorage.setItem("url_optigo", url_optigo);
        }
      } catch (err) {
        console.error("GetToken error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderComponent = () => {
    if (pid == 18223) {
      return <Spliter />; // 1315 Doc.
    } else if (pid == 18279) {
      return <OSRReportSpliter />; // 1553 Doc.
    } else if (pid == 18276) {
      return <FgSpliter />; //fg loss 1553 Doc.
      // return <EmployeeDepartmentReportSpliter />; //fg loss 1553 Doc.
    } else if (pid == 18226) {
      return <DustCollector />; // 1383 Doc.
    } else if (pid == 18227) {
      return <ToolReport />; // 1382 Doc.
    } else if (pid == 18228) {
      return <MFGReturnJob />; // 1386 Doc.
    } else if (pid == 18229) {
      return <ConversionDeatil />; // 1385 Doc.
    } else if (pid == 18230) {
      return <FinishGoodsReport />; // 1388 Doc.
    } else if (pid == 18231) {
      return <MaterialWiseSaleReport />; // 1389 Doc.
    } else if (pid == 18245) {
      return <StcokReport />; // 1392 Doc.
    } else if (pid == 18233) {
      return <DeviceSpliter />; // 1045 Doc.
    } else if (pid == 18234) {
      return <JobCompletion />; // 1256 Doc.
    } else if (pid == 18288) {
      return <LossRefiningReport />; // 1647 Doc.
    } else if (pid == 18296) {
      return <MaterialWiseWIP />; // 1728 Doc.
    } else if (pid == 18297) {
      return <CustomerReceiveReport />; // 1729 Doc.            // new tab open code
    } else if (pid == 18303) {
      return <CustomerReturnReport />; // 1748 Doc.             // new tab open code
    } else if (pid == 18309) {
      return <Materialmemoreport />; // 1747 Doc.               // new tab open code
    } else if (pid == 18304) {
      return <MaterialPurhcaseReturnReport />; // 1751 Doc.     // new tab open code
    } else if (pid == 18305) {
      return <MaterialSaleReport />; // 1752 Doc.               // new tab open code
    } else if (pid == 18307) {
      return <MaterialPurhcaseReport />; // 1750 Doc.           // new tab open code
    } else if (pid == 18310) {
      return <SignageDisplayList />; // 1256 Doc.
    } else if (pid == 18312) {
      return <STOCKVALUATION />; // 1438 Doc.
    } else if (pid == 18316) {
      return <StockMain />; // 1438 Doc.
    } else if (pid == 18369) {
      return <StockDetailBothTemp />; // 1438 Doc.
    } else if (pid == 18317) {
      return <StockDetailINTemp />; // 1438 Doc.
    } else if (pid == 18319) {
      return <StockDetailOUTTemp />; // 1438 Doc.
    } else if (pid == 1000) {
      return <ItaskReport />; // 1256 Doc.
    } else if (pid == 18324) {
      return <NewFirstSample />;
    } else if (pid == 18502) {
      return <AdvnaceWipReport />;
    } else if (pid == 18538) {
      return <CrmReport />;
    }  else if (pid == 18599) {
      return <CombinationMaker />;
    } 
    // else if (pid == 18573) {
    //   return <WebsiteManagementGrid />;
    // } 
    else {
      return (
        <div style={{ textAlign: "center", marginTop: "20%" }}>Invalid PID</div>
      );
    }
  };

  return (
    <div>
      {tokenMissing ? (
        <div
          style={{ display: "flex", width: "100%", justifyContent: "center" }}
        >
          <Box
            minHeight="70vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={2}
          >
            <Paper
              elevation={3}
              sx={{
                maxWidth: 500,
                width: "100%",
                p: 4,
                borderRadius: "20px",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mb={2}
              >
                <AlertTriangle size={48} color="#f44336" />
              </Box>

              <Typography variant="h5" fontWeight={600} gutterBottom>
                You've been logged out
              </Typography>

              <Typography variant="body1" color="text.secondary" mb={3}>
                Your session has ended. Please log in again to continue.
              </Typography>
            </Paper>
          </Box>
        </div>
      ) : isLoading ? (
        <div style={{ textAlign: "center", marginTop: "20%" }}>
          <CircularProgress />
        </div>
      ) : (
        renderComponent()
      )}
    </div>
  );
};

export default GridMain;