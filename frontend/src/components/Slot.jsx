import { Box, Button, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Slot({ slot, onBook, onCancel, onDelete }) {
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
      borderRadius: 2,
      opacity: slot.is_booked ? 0.7 : 1
    }}>
      <Typography>
        {new Date(slot.slot_time).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'
        })}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {slot.is_booked ? (
          <>
            <Typography variant="caption" color="error" sx={{ mr: 1 }}>Booked</Typography>
            <Button size="small" variant="outlined" color="warning" onClick={onCancel}>
              Cancel Appt
            </Button>
          </>
        ) : (
          <Button size="small" variant="outlined" onClick={onBook}>
            Book
          </Button>
        )}
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}