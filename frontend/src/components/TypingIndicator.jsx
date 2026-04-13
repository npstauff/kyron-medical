import { Box, Avatar } from '@mui/material'

export default function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'secondary.compliment',
          fontSize: 14,
          fontWeight: 700,
          mt: 0.5
        }}
      >
        K
      </Avatar>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: '18px 18px 18px 4px',
          bgcolor: '#f0f4f8',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        {[0, 1, 2].map(i => (
          <Box
            key={i}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: '#90a4ae',
              animation: 'bounce 1.2s infinite',
              animationDelay: `${i * 0.2}s`,
              '@keyframes bounce': {
                '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
                '40%': { transform: 'scale(1.2)', opacity: 1 },
              }
            }}
          />
        ))}
      </Box>
    </Box>
  )
}