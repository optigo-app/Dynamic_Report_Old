import { RecoilRoot } from "recoil";
import "./App.css";
import GridMain from "./GridMain";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import ConnectionManager from "./API/SoketConnection/ConnectionManager";
import { DeviceStatusProvider } from "./DeviceStatusContext";
import { ToastContainer } from "./Utils/Tostify/ToastManager";
import { getClientIpAddress } from "./Utils/globalFunc";
import { useEffect } from "react";

function AppWrapper() {
  
  function getBaseName() {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/]+\/[^/]+)/);
    return match ? `/${match[1]}` : "/";
  }

  useEffect(() => {
    getClientIpAddress();
  }, []);

  return (
    <RecoilRoot>
      <DeviceStatusProvider>
        <BrowserRouter basename={getBaseName()}>
          <App />
        </BrowserRouter>
      </DeviceStatusProvider>
    </RecoilRoot>
  );
}

function App() {
  const [searchParams] = useSearchParams();
  const pid = searchParams.get("pid");

  return (
    <>
      <ToastContainer />
      {pid === "18233" || pid === "18310" && <ConnectionManager />}
      <GridMain />
    </>
  );
}

export default AppWrapper;

// basename="/testreport"
// "homepage": "/testreport",

// Win + Alt + R
