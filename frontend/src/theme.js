import { createTheme } from '@mui/material'

export default createTheme({
  palette: {
    primary: {
      main: '#1565C0',
    },
    secondary: {
      main: '#2E7D32',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
})