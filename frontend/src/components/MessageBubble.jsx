import { Avatar, Box, colors, Paper, Typography } from "@mui/material";
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 1,
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
          padding: 2,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "secondary.main",
        }}
      >
        <Typography>{message.text}</Typography>
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
