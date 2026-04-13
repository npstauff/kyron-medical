



import { useEffect } from 'react';
import { useState } from 'react';
import { v4 as uuidv4} from 'uuid';
import axios from 'axios'
import { Box } from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL

export default function ChatPage() {

    const [messages, setMessages] = useState([]);

    const [sessionId] = useState(() => {
        const stored = localStorage.getItem("kyron_session_id")
        console.log("retrieved: ", stored);
        if (stored) return stored;
        const newId = uuidv4()
        localStorage.setItem('kyron_session_id', newId)
        console.log("creating new sessionId: ", newId);
        return newId
    })
    // Load previous conversation on mount
    useEffect(() => {
        const loadConversation = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/conversations/${sessionId}`)
            
            if (res.data.messages.length > 0) {
                console.log("has previous");
                setMessages(res.data.messages)
            } else {
                // No prior conversation, show greeting
                console.log("set greeting convo");
                setMessages([{
                role: 'assistant',
                text: "Hello! I'm the Kyron Medical scheduling assistant. I can help you book an appointment, check on a prescription refill, or answer questions about our offices.\n\nHow can I help you today?"
                }])
            }
            } catch (err) {
                console.error('Failed to load conversation:', err)
            }
        }

        loadConversation()
    }, [sessionId])

    return <Box>
        {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
        ))}
    </Box>
}