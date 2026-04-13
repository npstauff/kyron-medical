import { Box, Button, Typography } from "@mui/material";
export default function Slot({ slot, onBook }) {
  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      mt: 1,
      padding: 1,
      borderColor: slot.is_booked ? "error.main" : "primary.main",
      borderWidth: "1px",
      borderStyle: "solid",
      borderRadius: 1,
      opacity: slot.is_booked ? 0.6 : 1
    }}>
      <Typography>
        {new Date(slot.slot_time).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
        })}
      </Typography>
      {slot.is_booked ? (
        <Typography variant="caption" color="error">Booked</Typography>
      ) : (
        <Button size="small" variant="outlined" onClick={onBook}>
          Book
        </Button>
      )}
    </Box>
  )
}