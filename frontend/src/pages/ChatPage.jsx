import { useEffect } from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Box, IconButton, TextField } from "@mui/material";
import MessageBubble from "../components/MessageBubble";
import SendIcon from "@mui/icons-material/Send";
import TypingIndicator from "../components/TypingIndicator";

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatPage() {
  const [messages, setMessages] = useState([]);

  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);


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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = async () => {

    if(!currentMessage.trim() || loading){
        return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
setLoading(true);

    try {
        
        const res = await axios.post(`${API_URL}/api/chat`, {
            sessionId,
            message: userMessage
        });
        

        setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
        console.error("Failed to send message:", err);
        setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong." }]);
    } finally {
        setLoading(false);
    }

  }

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
      <Box
        sx={{
          padding: 2,
          flex:1,
          overflow: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <TypingIndicator />}
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
        <IconButton  onClick={sendMessage}>
          <SendIcon
            sx={{
              width: "5vh",
            }}
          />
        </IconButton>
      </Box>
    </Box>
  );
}
