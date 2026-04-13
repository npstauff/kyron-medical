import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PhoneIcon from "@mui/icons-material/Phone";

export default function AppTopBar({ setCallDialogOpen, isAdmin, switchPage }) {
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{ bgcolor: "white", color: "text.primary", }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Avatar sx={{ bgcolor: "primary.main", fontWeight: 700, mr: 2 }}>
          K
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600} lineHeight={1.2}>
            Kyron Medical
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "success.main", fontWeight: 500 }}
          >
            ● Online
          </Typography>
        </Box>
        {!isAdmin && (
          <Tooltip title="Switch to voice call">
            <Chip
              icon={<PhoneIcon sx={{ fontSize: 16 }} />}
              label="Switch to Call"
              onClick={() => setCallDialogOpen(true)}
              sx={{
                bgcolor: "secondary.main",
                color: "white",
                fontWeight: 500,
                "& .MuiChip-icon": { color: "white" },
                "&:hover": { bgcolor: "secondary.compliment" },
                cursor: "pointer",
              }}
            />
          </Tooltip>
        )}
        <Tooltip title={isAdmin ? "Back to chat page" : "Switch to admin page"}>
          <Chip
            label={isAdmin ? "Back to Chat" : "Admin"}
            onClick={() => switchPage()}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              fontWeight: 500,
              "& .MuiChip-icon": { color: "white" },
              "&:hover": { bgcolor: "primary.compliment" },
              cursor: "pointer",
            }}
          />
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
