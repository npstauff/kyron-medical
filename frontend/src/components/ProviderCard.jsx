import { Box, Paper, Typography } from "@mui/material";

export default function ProviderCard({ provider }) {
  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: 2,
      }}
    >
      <Box sx={{
        display: "flex",
        flexDirection: "column"
      }}>
        <Typography>{provider.name}</Typography>
        <Typography>{provider.specialty}</Typography>
      </Box>
    </Paper>
  );
}
