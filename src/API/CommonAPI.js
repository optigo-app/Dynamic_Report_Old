// ✅ CommonAPI.js
import axios from "axios";
export const CommonAPI = async (body, sp) => {
  let AllData = JSON.parse(sessionStorage.getItem("AuthqueryParams"));
  // const APIURL =
  //   AllData?.sv == 0
  //     ? "http://nextjstest.web/api/report"
  //     : "https://livenx.optigoapps.com/api/report";
  const APIURL =
    window.location.hostname == "localhost" ||
    window.location.hostname == "nzen"
      ? "http://newnextjs.web/api/report"
      : "https://livenx.optigoapps.com/api/report";

  let AuthorizationToken = sessionStorage.getItem("Token");

  try {
    const headers = {
      Authorization: `Bearer ${AuthorizationToken}`,
      Yearcode: `${AllData?.yc}`,
      version: "v4",
      sv: `${AllData?.sv}`,
      sp: `${sp}`,
    };
    const response = await axios.post(APIURL, body, { headers });
    return response?.data; // only return here if success
  } catch (error) {
    console.error(
      "API error is:",
      error.response ? error.response.data : error.message
    );
    throw error; // rethrow it so the caller knows API failed
  }
};
