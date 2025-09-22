// ✅ GetWorkerData.js
import { CommonAPI } from "../CommonAPI";

export const GetWorkerData = async (body, sp) => {
  try {
    const response = await CommonAPI(body, sp);
    return response; // only return if API call succeeded
  } catch (error) {
    console.error('GetWorkerData API Error:', error.response ? error.response.data : error.message);
    throw error; // rethrow if needed
  }
};
