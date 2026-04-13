import { useEffect } from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MessageBubble from "../components/MessageBubble";
import SendIcon from "@mui/icons-material/Send";
import PhoneIcon from "@mui/icons-material/Phone";
import TypingIndicator from "../components/TypingIndicator";
import { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import AppTopBar from "../components/AppTopBar";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatPage() {
  const [messages, setMessages] = useState([]);

  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callPhone, setCallPhone] = useState("");
  const [callLoading, setCallLoading] = useState(false);

  const [clearing, setClearing] = useState(false);

  const clearChat = async () => {
  setClearing(true)
  try {
    await axios.post(`${API_URL}/api/dev/reset-conversation`, { sessionId })
    localStorage.removeItem('kyron_session_id')
    window.location.reload()
  } catch (err) {
    console.error('Clear failed:', err)
  } finally {
    setClearing(false)
  }
}

  const navigate = useNavigate();

  var bottomRef = useRef();

  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("kyron_session_id");
    console.log("retrieved: ", stored);
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem("kyron_session_id", newId);
    console.log("creating new sessionId: ", newId);
    return newId;
  });
  // Load previous conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/conversations/${sessionId}`
        );

        if (res.data.messages.length > 0) {
          console.log("has previous");
          setMessages(res.data.messages);
        } else {
          // No prior conversation, show greeting
          console.log("set greeting convo");
          setMessages([
            {
              role: "assistant",
              text:
                "Hello! I'm the Kyron Medical scheduling assistant. I can help you book an appointment, check on a prescription refill, or answer questions about our offices.\n\nHow can I help you today?",
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    };

    loadConversation();
  }, [sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initiateCall = async () => {
    if (!callPhone.trim()) return;

    let phone = callPhone.trim(); // strip non-digits
    if (phone.length === 10) phone = "1" + phone; // add country code
    phone = "+" + phone;
    console.log(phone);
    setCallLoading(true);

    try {
      await axios.post(`${API_URL}/api/voice/initiate`, {
        sessionId,
        phoneNumber: phone,
      });
      setCallDialogOpen(false);
      setCallPhone("");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Calling you now at ${phone}! The AI will continue our conversation seamlessly over the phone.`,
        },
      ]);
    } catch (err) {
      console.error("Call failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, we were unable to initiate the call. Please try again.",
        },
      ]);
      setCallDialogOpen(false);
    } finally {
      setCallLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || loading) {
      return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, {
        sessionId,
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.data.reply },
      ]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        padding: 1,
      }}
    >
      <AppTopBar switchPage={() => {navigate('/admin')}} isAdmin={false} setCallDialogOpen={setCallDialogOpen}/>

      <Box
        sx={{
          padding: 2,
          flex: 1,
          overflow: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </Box>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        <TextField
          sx={{
            width: "100%",
          }}
          placeholder="Enter message..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          value={currentMessage}
        ></TextField>
        <IconButton onClick={sendMessage}>
          <SendIcon
            sx={{
              width: "5vh",
            }}
          />
        </IconButton>
      </Box>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: "block", textAlign: "center", mt: 1 }}
      >
        For medical emergencies call 911. This assistant cannot provide medical
        advice.
      </Typography>
      <Dialog
        open={callDialogOpen}
        onClose={() => setCallDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Switch to Voice Call</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your phone number and we'll call you right away. The AI will
            pick up exactly where your chat left off.
          </Typography>
          <Box sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
          }}>
            <TextField
            sx={{
                width: "13%"
            }}
              fullWidth
              label="+1"
              placeholder="+1"
              disabled={true}
              value={callPhone}
              size="small"
            />
            <TextField
              fullWidth
              label="Phone number"
              placeholder="+1 (555) 000-0000"
              value={callPhone}
              onChange={(e) => setCallPhone(e.target.value)}
              size="small"
              onKeyDown={(e) => e.key === "Enter" && initiateCall()}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCallDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={initiateCall}
            disabled={!callPhone.trim() || callLoading}
          >
            {callLoading ? "Calling..." : "Call Me Now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


