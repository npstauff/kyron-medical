export default function TypingIndicator() {
  <Box
    sx={{
      width: "100%",
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
    }}
  >
    <Box
      sx={{
        display: "flex",
        maxWidth: "75%",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 1,
        mb: 2,
        padding: 2,
        borderRadius: 2,
        bgcolor: "secondary.main",
      }}
    >
      <Avatar
        sx={{
          bgcolor: "secondary.compliment",
        }}
      >
        A
      </Avatar>
    </Box>
  </Box>;
}
