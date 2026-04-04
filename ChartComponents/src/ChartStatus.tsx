import { Alert, Box } from '@mui/material';

export function ChartStatus({
  message,
  severity = 'error',
}: {
  message: string;
  severity?: 'error' | 'info' | 'warning';
}) {
  return (
    <Box
      sx={{
        p: 2,
        width: '100%',
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
    >
      <Alert severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Box>
  );
}
