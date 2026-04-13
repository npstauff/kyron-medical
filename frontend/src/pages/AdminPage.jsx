import { Box } from "@mui/material";
import AppTopBar from "../components/AppTopBar";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
    const naviagte = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <AppTopBar setCallDialogOpen={() => {}} switchPage={()=>{naviagte('/')}} isAdmin={true}/>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
        }}
      ></Box>
    </Box>
  );
}
