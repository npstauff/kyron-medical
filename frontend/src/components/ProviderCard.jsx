import { Avatar, Box, Button, Paper, Typography } from "@mui/material";

export default function ProviderCard({ provider, onSelect }) {
  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: 2,
      }}
    >
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 2
      }}>
        <Avatar sx={{ bgcolor: "primary.main" }}>
          {provider.name.replace("Dr. ", "").charAt(0).toUpperCase()}
        </Avatar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="subtitle1">{provider.name}</Typography>
          <Typography variant="subtitle2">{provider.specialty}</Typography>
        </Box>
      </Box>
      <Button
        variant="contained"
        sx={{
          color: "white",
        }}
        onClick={() => onSelect()}
      >
        View Availability
      </Button>
    </Paper>
  );
}
