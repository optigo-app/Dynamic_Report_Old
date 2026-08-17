// ✅ GetWorkerData.js
import { CommonAPI, CommonAPINew } from "../CommonAPI";

export const GetWorkerData = async (body, sp) => {
  try {
    const response = await CommonAPI(body, sp);
    return response; // only return if API call succeeded
  } catch (error) {
    console.error('GetWorkerData API Error:', error.response ? error.response.data : error.message);
    throw error; // rethrow if needed
  }
};


export const CallNewAPI = async (body, sp, version) => {
  try {
    const response = await CommonAPINew(body, sp, version);
    return response; // only return if API call succeeded
  } catch (error) {
    console.error('GetWorkerData API Error:', error.response ? error.response.data : error.message);
    throw error; // rethrow if needed
  }
};
