import { Avatar, Box, colors, Typography } from "@mui/material";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <Box sx={{
        width: "100%",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
    }}>
      <Box
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
        {!isUser ? (
          <Avatar
            sx={{
              bgcolor: isUser ? "primary.compliment" : "secondary.compliment",
            }}
          >
            A
          </Avatar>
        ) : null}
        <Typography>{message.text}</Typography>
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
    </Box>
  );
}
