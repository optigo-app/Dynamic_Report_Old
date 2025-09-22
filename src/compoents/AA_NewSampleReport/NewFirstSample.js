// http://localhost:3000/testreport/?sp=6&ifid=ToolsReport&pid=18324

import OtherKeyData from "./NewSampleData.json";
import { DragDropContext } from "@hello-pangea/dnd";
import NewSampleReport from "./NewSampleReport";
import masterData from "./masterData.json";
import { useState, useRef } from "react";
import {
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import {
  Pagination,
  Autoplay,
  EffectCube,
  Navigation,
  EffectFade,
} from "swiper/modules";
import slide1 from "./slider1.png";
import slide2 from "./slider4.png";
import slide3 from "./slider3.png";
import slide4 from "./slider2.png";
import "./NewFirstSample.css";

export default function NewFirstSample() {
  const [showReportMaster, setShowReportMaster] = useState(false);
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const masterRef = useRef(null);
  const reportRef = useRef(null);
  const onDragEnd = () => {};
  const handleSave = () => {
    setShowReportMaster(false);
  };

  const handleBack = () => {
    setShowReportMaster(true);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <SwitchTransition>
        <CSSTransition
          key={showReportMaster ? "master" : "report"}
          timeout={600}
          classNames="fade-slide"
          nodeRef={showReportMaster ? masterRef : reportRef}
        >
          {showReportMaster ? (
            <div ref={masterRef} className="master-container">
              <div className="slider-view">
                <Swiper
                  spaceBetween={30}
                  loop={true} 
                  effect="fade" 
                  fadeEffect={{ crossFade: true }}
                  autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  navigation={true} 
                  pagination={{ clickable: true }} 
                  modules={[EffectFade, Navigation, Autoplay, Pagination]}
                  className="slider-swiper"
                >
                  <SwiperSlide>
                    <img src={slide1} alt="slide1" />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img src={slide2} alt="slide1" />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img src={slide3} alt="slide1" />
                  </SwiperSlide>
                  <SwiperSlide>
                    <img src={slide4} alt="slide1" />
                  </SwiperSlide>
                </Swiper>
              </div>

              <div className="master-form">
                <div className="master_form_sub">
                  <h2 className="master-title">Master Selection</h2>

                  <FormControl className="master-dropdown">
                    <InputLabel>Company</InputLabel>
                    <Select
                      label="Company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    >
                      {masterData.company.map((c) => (
                        <MenuItem key={c.id} value={c.name}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl className="master-dropdown">
                    <InputLabel>Department</InputLabel>
                    <Select
                      label="Department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      {masterData.department.map((d) => (
                        <MenuItem key={d.id} value={d.name}>
                          {d.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    className="save-btn"
                    disabled={!company || !department}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div ref={reportRef} className="report-container">
              <NewSampleReport
                OtherKeyData={OtherKeyData}
                mode="finishgoodsreport"
                onBack={handleBack}
              />
            </div>
          )}
        </CSSTransition>
      </SwitchTransition>
    </DragDropContext>
  );
}
