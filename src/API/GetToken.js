import axios from "axios";

export const GetToken = async (body, yCode, sv, sp) => {
  // const APIURL =
  //   sv == 0
  //     ? "http://nextjstest.web/api/report"
  //     : "https://livenx.optigoapps.com/api/report";

  const APIURL =
    window.location.hostname == "localhost" ||
    window.location.hostname == "nzen"
      ? "http://newnextjs.web/api/report"
      : "https://livenx.optigoapps.com/api/report";
  try {
    const headers = {
      Authorization: "",
      YearCode: `${yCode}`,
      version: "v4",
      sv: `${sv}`,
      sp: `${sp}`,
    };

    const response = await axios.post(APIURL, body, { headers });
    return response?.data;
  } catch (error) {
    console.error("error is..", error);
  }
};
