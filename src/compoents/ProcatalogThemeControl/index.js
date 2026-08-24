import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Container,
  Snackbar,
  Alert,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import '@fontsource-variable/figtree/wght.css';


const PALETTES = [
  {
    id: 1,
    name: "Apple Intelligence",
    tag: "Siri & Neural",
    accent: "#007AFF",
    swatches: [
      { hex: "#007AFF", role: "Primary" },
      { hex: "#AF52DE", role: "Neural" },
      { hex: "#FF2D55", role: "Accent" },
      { hex: "#F5EEF8", role: "Surface" },
    ],
  },
  {
    id: 2,
    name: "Cupertino iOS 18",
    tag: "System Classic",
    accent: "#007AFF",
    swatches: [
      { hex: "#007AFF", role: "System Blue" },
      { hex: "#5856D6", role: "Indigo" },
      { hex: "#00C7BE", role: "Mint" },
      { hex: "#F2F2F7", role: "Canvas" },
    ],
  },
  {
    id: 3,
    name: "Desert Titanium",
    tag: "Pro Hardware",
    accent: "#876D4E",
    swatches: [
      { hex: "#BFA07A", role: "Titanium" },
      { hex: "#876D4E", role: "Bronze" },
      { hex: "#ECE4D8", role: "Shell" },
      { hex: "#F9F7F4", role: "Sand" },
    ],
  },
  {
    id: 4,
    name: "Natural Titanium",
    tag: "Pro Hardware",
    accent: "#48474A",
    swatches: [
      { hex: "#9C988F", role: "Natural" },
      { hex: "#48474A", role: "Graphite" },
      { hex: "#D7D4CC", role: "Lustre" },
      { hex: "#F4F3F0", role: "Ceramic" },
    ],
  },
  {
    id: 5,
    name: "visionOS Spatial",
    tag: "Spatial Glass",
    accent: "#38BDF8",
    swatches: [
      { hex: "#0F172A", role: "Space" },
      { hex: "#38BDF8", role: "Aqua" },
      { hex: "#BAE6FD", role: "Frosted" },
      { hex: "#F8FAFC", role: "Specular" },
    ],
  },
  {
    id: 6,
    name: "macOS Sequoia Forest",
    tag: "Nature Tone",
    accent: "#248A3D",
    swatches: [
      { hex: "#1C3F3A", role: "Deep Pine" },
      { hex: "#34C759", role: "Green" },
      { hex: "#D1F2D9", role: "Mint" },
      { hex: "#F4F8F5", role: "Mist" },
    ],
  },
  {
    id: 7,
    name: "Activity Rings",
    tag: "Fitness",
    accent: "#FA114F",
    swatches: [
      { hex: "#FA114F", role: "Move" },
      { hex: "#A8FF00", role: "Exercise" },
      { hex: "#00E3FF", role: "Stand" },
      { hex: "#1C1C1E", role: "Canvas" },
    ],
  },
  {
    id: 8,
    name: "Ultramarine Studio",
    tag: "Dynamic",
    accent: "#4765FF",
    swatches: [
      { hex: "#4765FF", role: "Ultramarine" },
      { hex: "#64D2FF", role: "Sky" },
      { hex: "#E0E7FF", role: "Ice" },
      { hex: "#F5F7FF", role: "Cloud" },
    ],
  },
  {
    id: 9,
    name: "Monterey Coral",
    tag: "Warm System",
    accent: "#FF5B37",
    swatches: [
      { hex: "#FF5B37", role: "Coral" },
      { hex: "#FF9F0A", role: "Amber" },
      { hex: "#FFE5DE", role: "Mist" },
      { hex: "#FFF9F7", role: "Sand" },
    ],
  },
  {
    id: 10,
    name: "Cupertino Dark",
    tag: "OLED System",
    accent: "#2997FF",
    swatches: [
      { hex: "#000000", role: "True Dark" },
      { hex: "#1C1C1E", role: "Elevated" },
      { hex: "#2997FF", role: "Highlight" },
      { hex: "#8E8E93", role: "Muted" },
    ],
  },
  {
    id: 11,
    name: "Highland Lavender",
    tag: "Pastel Tint",
    accent: "#7D52DE",
    swatches: [
      { hex: "#7D52DE", role: "Purple" },
      { hex: "#BF5AF2", role: "Lilac" },
      { hex: "#EBE2FC", role: "Violet" },
      { hex: "#F8F6FD", role: "Porcelain" },
    ],
  },
  {
    id: 12,
    name: "Space Gray Alum",
    tag: "Minimal Studio",
    accent: "#1D1D1F",
    swatches: [
      { hex: "#1D1D1F", role: "Space Black" },
      { hex: "#636366", role: "Graphite" },
      { hex: "#D2D2D7", role: "Silver" },
      { hex: "#F5F5F7", role: "Light" },
    ],
  },
];

const CATEGORIES = [
  "All",
  "System Classic",
  "Pro Hardware",
  "Spatial Glass",
  "Fitness",
  "Dynamic",
];

export default function ColorPaletteDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const [toastOpen, setToastOpen] = useState(false);
  const [copiedHex, setCopiedHex] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredPalettes =
    activeCategory === "All"
      ? PALETTES
      : PALETTES.filter((p) => p.tag === activeCategory);

  const handleCopy = (hex) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setToastOpen(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#FAFAFC",
        color: "#1D1D1F",
        fontFamily:
          '"Figtree Variable", sans-serif !important',
        pb: 12,
        position: "relative",
      }}
    >
      {/* 0. FULLSCREEN APPLE DESIGN LOADER */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#f6f7fb",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2.5,
          }}
        >
          <style>{`
            .loader {
              width: 75px;
              height: 75px;
              min-width: 75px;
              min-height: 75px;
              aspect-ratio: 1;
              animation: l3 1.2s infinite alternate ease-in-out;
              background: linear-gradient(135deg, #b434ff 0%, #6900c6 45%, #9e00ff 75%, #c85cff 100%);
              border-radius: 22px;
              box-shadow: 0 12px 40px rgba(105, 0, 198, 0.35), 0 0 0 1px rgba(180, 52, 255, 0.15);
            }
            @keyframes l3 {
              0%{clip-path: shape(from 85.0242216976% 60.8470934779%, curve to 80.3178442208% 70.6199870088% with 95.0484433951% 71.6941869559%, curve to 63.3566458721% 84.1460913354% with 65.5872450465% 69.5457870617%, curve to 52.7815116745% 86.5597967068% with 61.1260466978% 98.7463956091%, curve to 31.6312432791% 81.732385964% with 44.4369766511% 74.3731978045%, curve to 23.1506441048% 74.9693338007% with 18.8255099071% 89.0915741234%, curve to 13.7378891512% 55.423546739% with 27.4757783024% 60.8470934779%, curve to 13.7378891512% 44.576453261% with 0% 50%, curve to 23.1506441048% 25.0306661993% with 27.4757783024% 39.1529065221%, curve to 31.6312432791% 18.267614036% with 18.8255099071% 10.9084258766%, curve to 52.7815116745% 13.4402032932% with 44.4369766511% 25.6268021955%, curve to 63.3566458721% 15.8539086646% with 61.1260466978% 1.2536043909%, curve to 80.3178442208% 29.3800129912% with 65.5872450465% 30.4542129383%, curve to 85.0242216976% 39.1529065221% with 95.0484433951% 28.3058130441%, curve to 85.0242216976% 60.8470934779% with 75% 50%)}
              to {clip-path: shape(from 86.2621108488% 55.423546739%, curve to 76.8493558952% 74.9693338007% with 72.5242216976% 60.8470934779%, curve to 68.3687567209% 81.732385964% with 81.1744900929% 89.0915741234%, curve to 47.2184883255% 86.5597967068% with 55.5630233489% 74.3731978045%, curve to 36.6433541279% 84.1460913354% with 38.8739533022% 98.7463956091%, curve to 19.6821557792% 70.6199870088% with 34.4127549535% 69.5457870617%, curve to 14.9757783024% 60.8470934779% with 4.9515566049% 71.6941869559%, curve to 14.9757783024% 39.1529065221% with 25% 50%, curve to 19.6821557792% 29.3800129912% with 4.9515566049% 28.3058130441%, curve to 36.6433541279% 15.8539086646% with 34.4127549535% 30.4542129383%, curve to 47.2184883255% 13.4402032932% with 38.8739533022% 1.2536043909%, curve to 68.3687567209% 18.267614036% with 55.5630233489% 25.6268021955%, curve to 76.8493558952% 25.0306661993% with 81.1744900929% 10.9084258766%, curve to 86.2621108488% 44.576453261% with 72.5242216976% 39.1529065221%, curve to 86.2621108488% 55.423546739% with 100% 50%)}
            }
          `}</style>

          <div className="loader" />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: "#1D1D1F",
                letterSpacing: "-0.015em",
                fontSize: "0.95rem",
                mb: 0.4,
              }}
            >
              procatalog.web
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#86868B",
                fontSize: "0.8125rem",
                fontWeight: 400,
                letterSpacing: "-0.01em",
              }}
            >
              Loading Curated visual themes, brand accents, and design
            tokens...
            </Typography>
          </Box>
        </Box>
      )}

      <Box
        sx={{
          position: "sticky",
          top: { xs: 12, md: 18 },
          zIndex: 1100,
          px: { xs: 2, md: 3 },
          pointerEvents: "none",
        }}
      >
        <Container maxWidth="lg" sx={{ p: "0 !important" }}>
          <Box
            sx={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Simple Unboxed Domain + Green Dot */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                px: 2.4,
                py: 1,
                userSelect: "none",
                borderRadius: "85px", // Continuous smooth pill capsule
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(0, 0, 0, 0.07)",
                boxShadow: "0 2px 14px rgba(0, 0, 0, 0.04)",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#34C759",
                  boxShadow: "0 0 6px rgba(52, 199, 89, 0.5)",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  letterSpacing: "-0.015em",
                  color: "#1D1D1F",
                  textTransform: "capitalize",
                }}
              >
                procatalog.web
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2. MAIN CONTENT AREA */}
      <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 5 } }}>
        {/* Header Typography */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "1.65rem", md: "2rem" },
              letterSpacing: "-0.025em",
              color: "#1D1D1F",
              mb: 0.5,
            }}
          >
            Theme Configuration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#86868B",
              fontSize: "0.9375rem",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
            }}
          >
            Select and apply curated visual themes, brand accents, and design
            tokens for procatalog.web.
          </Typography>
        </Box>

        {/* Minimal Category Filter Tabs */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            mb: 4,
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Box
                key={cat}
                onClick={() => setActiveCategory(cat)}
                sx={{
                  cursor: "pointer",
                  px: 1.6,
                  py: 0.5,
                  borderRadius: "999px",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: "-0.01em",
                  backgroundColor: isActive ? "#1D1D1F" : "transparent",
                  color: isActive ? "#FFFFFF" : "#86868B",
                  border: isActive
                    ? "1px solid #1D1D1F"
                    : "1px solid rgba(0, 0, 0, 0.08)",
                  userSelect: "none",
                }}
              >
                {cat}
              </Box>
            );
          })}
        </Box>

        {/* 3. MUI GRID */}
        <Grid container spacing={2.5}>
          {filteredPalettes.map((palette) => {
            const isApplied = selectedId === palette.id;

            return (
              <Grid key={palette.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    borderRadius: "14px",
                    backgroundColor: "#FFFFFF",
                    border: isApplied
                      ? "1px solid #1D1D1F"
                      : "1px solid rgba(0, 0, 0, 0.07)",
                    boxShadow: "none",
                    transition: "none",
                  }}
                >
                  <CardContent sx={{ p: 2.2, pb: 1 }}>
                    {/* Top Row: Name and Tag */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        mb: 1.8,
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          letterSpacing: "-0.015em",
                          color: "#1D1D1F",
                        }}
                      >
                        {palette.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          color: "#86868B",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {palette.tag}
                      </Typography>
                    </Box>

                    {/* Continuous Palette Strip */}
                    <Box
                      sx={{
                        display: "flex",
                        height: 38,
                        borderRadius: "8px",
                        overflow: "hidden",
                        mb: 2,
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      {palette.swatches.map((item, idx) => (
                        <Box
                          key={idx}
                          onClick={() => handleCopy(item.hex)}
                          sx={{
                            flex: 1,
                            backgroundColor: item.hex,
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Box>

                    {/* Hex Values & Roles */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 0.5,
                        textAlign: "center",
                      }}
                    >
                      {palette.swatches.map((item, idx) => (
                        <Box
                          key={idx}
                          onClick={() => handleCopy(item.hex)}
                          sx={{
                            cursor: "pointer",
                            py: 0.4,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontSize: "0.72rem",
                              fontFamily:
                                "SFMono-Regular, Menlo, Monaco, monospace",
                              fontWeight: 500,
                              color: "#1D1D1F",
                              letterSpacing: "-0.01em",
                              mb: 0.2,
                            }}
                          >
                            {item.hex}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontSize: "0.65rem",
                              fontWeight: 400,
                              color: "#86868B",
                            }}
                          >
                            {item.role}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>

                  {/* CARD ACTIONS (APPLY BUTTON) */}
                  <CardActions sx={{ p: 2.2, pt: 1.5 }}>
                    <Button
                      fullWidth
                      disableElevation
                      disableRipple
                      variant="contained"
                      onClick={() => setSelectedId(palette.id)}
                      startIcon={
                        isApplied ? (
                          <CheckRoundedIcon
                            sx={{ fontSize: "15px !important" }}
                          />
                        ) : null
                      }
                      sx={{
                        height: 34,
                        borderRadius: "8px",
                        textTransform: "none",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                        boxShadow: "none",
                        backgroundColor: isApplied ? "#1D1D1F" : "#F2F2F7",
                        color: isApplied ? "#FFFFFF" : "#1D1D1F",
                        "&:hover": {
                          backgroundColor: isApplied ? "#1D1D1F" : "#F2F2F7",
                          boxShadow: "none",
                        },
                      }}
                    >
                      {isApplied ? "Applied" : "Apply"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* Copy Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={1500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          icon={false}
          sx={{
            py: 0.2,
            px: 2,
            borderRadius: "999px",
            fontWeight: 400,
            fontSize: "0.8125rem",
            backgroundColor: "#1D1D1F",
            color: "#FFFFFF",
            boxShadow: "none",
          }}
        >
          Copied {copiedHex}
        </Alert>
      </Snackbar>
    </Box>
  );
}
