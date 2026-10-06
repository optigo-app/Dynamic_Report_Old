import { keyframes } from "@mui/system";
import { Box } from "@mui/material";
 const scanLine = keyframes`
  0%   { top: 6%; }
  50%  { top: 88%; }
  100% { top: 6%; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
`;

// Bar widths (px) and gaps to imitate a barcode
const BARS = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 4, 2];

function BarcodeScanAnimation( { COLORS }) {
  return (
    <Box
      sx={{
        position: "relative",
        height: 64,
        mb: 2,
        borderRadius: "8px",
        bgcolor: COLORS.successBg ?? "#f4f6f8",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "3px",
        px: 2,
      }}
    >
      {BARS.map((w, i) => (
        <Box
          key={i}
          sx={{
            width: `${w}px`,
            height: "60%",
            bgcolor: "text.primary",
            opacity: 0.8,
            borderRadius: "1px",
            flexShrink: 0,
          }}
        />
      ))}

      {/* scanning laser line */}
      <Box
        sx={{
          position: "absolute",
          left: 8,
          right: 8,
          height: 2,
          bgcolor: COLORS.danger ?? "#e53935",
          borderRadius: "2px",
          boxShadow: `0 0 8px 2px ${COLORS.danger ?? "#e53935"}`,
          animation: `${scanLine} 1.8s ease-in-out infinite, ${pulseGlow} 0.9s ease-in-out infinite`,
        }}
      />
    </Box>
  );
}

export default BarcodeScanAnimation;