import { Avatar, Box, colors, Paper, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import { keyframes } from '@mui/system'

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`

const slideUp = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(16px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
`

const MarkdownComponents = {
  p: ({ children }) => (
    <span style={{ display: 'block', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 4 }}>
      {children}
    </span>
  ),
  li: ({ children }) => (
    <li style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{children}</li>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600 }}>{children}</strong>
  ),
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 1,
        animation: `${slideUp} 0.2s ease-out`,
      }}
    >
      {!isUser ? (
        <Avatar
          sx={{
            bgcolor: isUser ? "primary.compliment" : "secondary.compliment",
          }}
        >
          K
        </Avatar>
      ) : null}
      <Paper
        sx={{
          display: "flex",
          maxWidth: "75%",
          justifyContent: isUser ? "flex-end" : "flex-start",
          alignItems: "center",
          gap: 1,
          mb: 2,
          padding: 3,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "secondary.main",
        }}
      >
        <Typography>
          <ReactMarkdown components={MarkdownComponents}>{message.text}</ReactMarkdown>
        </Typography>
      </Paper>
      {isUser ? (
        <Avatar
          sx={{
            bgcolor: isUser ? "primary.compliment" : "secondary.compliment",
          }}
        >
          Me
        </Avatar>
      ) : null}
    </Box>
  );
}
