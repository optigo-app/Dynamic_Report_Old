import { RecoilRoot } from "recoil";
import "./App.css";
import GridMain from "./GridMain";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import ConnectionManager from "./API/SoketConnection/ConnectionManager";
import { DeviceStatusProvider } from "./DeviceStatusContext";
import { ToastContainer } from "./Utils/Tostify/ToastManager";

function AppWrapper() {
  return (
    <RecoilRoot>
      <DeviceStatusProvider>
        <BrowserRouter>
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
      {pid === "18233" && <ConnectionManager />}
      <GridMain />
    </>
  );
}

export default AppWrapper;

// basename="/testreport"
// "homepage": "/testreport",

// Win + Alt + R