import { Typography } from "@mui/material";

export default function MessageBubble({message}) {
    const isUser = message.role === "user";

    return <Box>
        <Typography>
            {message.text}
        </Typography>
    </Box>
}