import { Box } from "@mui/material";
import AppTopBar from "../components/AppTopBar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import ProviderCard from "../components/ProviderCard";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminPage() {
  const naviagte = useNavigate();

  const [slots, setSlots] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchProviders();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/availability`);
      setSlots(res.data.slots);
      const unique = [
        ...new Map(
          res.data.slots.map((s) => [
            s.provider_id,
            {
              id: s.provider_id,
              name: s.provider_name,
            },
          ])
        ).values(),
      ];
      setProviders(unique);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/availability/providers`);
      setProviders(res.data.providers);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <AppTopBar
        setCallDialogOpen={() => {}}
        switchPage={() => {
          naviagte("/");
        }}
        isAdmin={true}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          gap: 1,
        }}
      >
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          width: "30%",
          gap: 2,
          padding: 2,
        }}>
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
