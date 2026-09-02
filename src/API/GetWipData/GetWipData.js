import axios from 'axios';

export const GetWipData = async (stat, end) => {
  const sp = 103;
  let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
  const clientIpAddress = sessionStorage.getItem("clientIpAddress");
 
  const APIURL =
  window.location.hostname == "localhost" ||
  window.location.hostname == "nzen"
    ? "http://newnextjs.web/api/report"
    : "https://apilx.optigoapps.com/api/report";

    const VERSION =
    window.location.hostname == "localhost" ||
    window.location.hostname == "nzen"
      ?  "beta"
      : "live";

  // Payload matching the verified working structure
  const body = {
    con: JSON.stringify({
      mode: "GetFullReport",
      appuserid: AllData?.uid || "",
      IPAddress: clientIpAddress || ""
    }),
    f: "DynamicReport ( data )",
    p: JSON.stringify({
      ReportId: 76,
      IsMaster: "0",
      FilterStartDate: stat,
      FilterEndDate: end
    })
  };

  try {
    const response = await axios.post(APIURL, body, {
      headers: {
         
        'Yearcode': `${AllData?.yc}`,
        'version': `${VERSION}`,
        'sp': sp,
        'sv': `${AllData?.sv}`
      }
    });

    return response.data;
  } catch (error) {
    console.error("API Call Error:", error.response ? error.response.data : error.message);
    throw error;
  }
};