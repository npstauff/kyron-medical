import {
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AppTopBar from "../components/AppTopBar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import ProviderCard from "../components/ProviderCard";
import Slot from "../components/Slot";
import { DateCalendar, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import AddIcon from "@mui/icons-material/Add";

dayjs.extend(utc);

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPage() {
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  // Add slot dialog
  const [addSlotOpen, setAddSlotOpen] = useState(false);
  const [newSlotTime, setNewSlotTime] = useState(dayjs().hour(9).minute(0));
  const [addingSlot, setAddingSlot] = useState(false);

  // Book appointment dialog
  const [bookOpen, setBookOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookForm, setBookForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    phone: "",
    email: "",
    reason: "",
    sms_opt_in: false,
  });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchProviders();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/availability`);
      setSlots(res.data.slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/availability/providers`);
      setProviders(res.data.providers);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelAppointment = async (slotId) => {
    try {
      await axios.patch(`${API_URL}/api/availability/${slotId}/cancel`);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, is_booked: false } : s))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API_URL}/api/availability/${slotId}`);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      console.error(err);
    }
  };

  const addSlot = async () => {
    setAddingSlot(true);
    try {
      const slotTime = dayjs
        .utc(selectedDate.format("YYYY-MM-DD"))
        .hour(newSlotTime.hour())
        .minute(newSlotTime.minute())
        .second(0)
        .toISOString();

      await axios.post(`${API_URL}/api/availability`, {
        provider_id: selectedProvider.id,
        slot_time: slotTime,
      });

      await fetchSlots();
      setAddSlotOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSlot(false);
    }
  };

  const bookAppointment = async () => {
    setBooking(true);
    try {
      await axios.post(`${API_URL}/api/chat`, {
        sessionId: `admin-${Date.now()}`,
        message: `Book appointment for slot ${bookingSlot.id} for patient ${bookForm.first_name} ${bookForm.last_name}, DOB ${bookForm.dob}, phone ${bookForm.phone}, email ${bookForm.email}, reason: ${bookForm.reason}`,
      });
      await fetchSlots();
      setBookOpen(false);
      setBookForm({
        first_name: "",
        last_name: "",
        dob: "",
        phone: "",
        email: "",
        reason: "",
        sms_opt_in: false,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBooking(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100vh",
      }}
    >
      <AppTopBar
        setCallDialogOpen={() => {}}
        switchPage={() => navigate("/")}
        isAdmin={true}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          gap: 1,
          padding: 2,
        }}
      >
        {!loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "40%",
              gap: 2,
            }}
          >
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onSelect={() => setSelectedProvider(p)}
              />
            ))}
          </Box>
        ) : (
          <Typography>Loading...</Typography>
        )}

        <Paper
          sx={{
            width: "60%",
            height: "100%",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}
        >
          {selectedProvider !== null ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "auto",
              }}
            >
              <Typography variant="h6">{selectedProvider.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedProvider.specialty}
              </Typography>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar value={selectedDate} onChange={setSelectedDate} />
              </LocalizationProvider>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="h6">
                  Slots for {selectedDate.format("MMMM D, YYYY")}
                </Typography>
                <IconButton
                  color="primary"
                  onClick={() => setAddSlotOpen(true)}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {slots
                .filter(
                  (s) =>
                    s.provider_id === selectedProvider.id &&
                    dayjs(s.slot_time).utc().isSame(selectedDate, "day")
                )
                .map((s) => (
                  <Slot
                    key={s.id}
                    slot={s}
                    onBook={() => {
                      setBookingSlot(s);
                      setBookOpen(true);
                    }}
                    onCancel={() => cancelAppointment(s.id)}
                    onDelete={() => deleteSlot(s.id)}
                  />
                ))}
            </Box>
          ) : (
            <Typography variant="h6">No Provider Selected</Typography>
          )}
        </Paper>
      </Box>

      {/* Add Slot Dialog */}
      <Dialog
        open={addSlotOpen}
        onClose={() => setAddSlotOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>Add New Slot</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adding slot for {selectedProvider?.name} on{" "}
            {selectedDate?.format("MMMM D, YYYY")}
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label="Time"
              value={newSlotTime}
              onChange={setNewSlotTime}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddSlotOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={addSlot} disabled={addingSlot}>
            {addingSlot ? "Adding..." : "Add Slot"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Book Appointment Dialog */}
      <Dialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={600}>Book Appointment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Booking with {selectedProvider?.name} at{" "}
            {bookingSlot &&
              new Date(bookingSlot.slot_time).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "UTC",
              })}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First name"
                size="small"
                fullWidth
                value={bookForm.first_name}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, first_name: e.target.value }))
                }
              />
              <TextField
                label="Last name"
                size="small"
                fullWidth
                value={bookForm.last_name}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, last_name: e.target.value }))
                }
              />
            </Box>
            <TextField
              label="Date of birth"
              size="small"
              fullWidth
              placeholder="YYYY-MM-DD"
              value={bookForm.dob}
              onChange={(e) =>
                setBookForm((p) => ({ ...p, dob: e.target.value }))
              }
            />
            <TextField
              label="Phone"
              size="small"
              fullWidth
              value={bookForm.phone}
              onChange={(e) =>
                setBookForm((p) => ({ ...p, phone: e.target.value }))
              }
            />
            <TextField
              label="Email"
              size="small"
              fullWidth
              value={bookForm.email}
              onChange={(e) =>
                setBookForm((p) => ({ ...p, email: e.target.value }))
              }
            />
            <TextField
              label="Reason for visit"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={bookForm.reason}
              onChange={(e) =>
                setBookForm((p) => ({ ...p, reason: e.target.value }))
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={bookForm.sms_opt_in}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, sms_opt_in: e.target.checked }))
                  }
                  color="success"
                />
              }
              label="Send SMS confirmation"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBookOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={bookAppointment}
            disabled={booking || !bookForm.first_name || !bookForm.email}
          >
            {booking ? "Booking..." : "Book Appointment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
