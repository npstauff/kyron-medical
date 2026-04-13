import { createTheme } from '@mui/material'

export default createTheme({
  palette: {
    primary: {
      main: '#BA8EE3',
      compliment: "#8969A7"
    },
    secondary: {
      main: '#87ACE1',
      compliment: "#6681A7"
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