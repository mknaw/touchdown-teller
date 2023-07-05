import Paper from '@mui/material/Paper';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <Paper variant='outlined' sx={{ p: 2, height: 1 }}>
      {/* TODO maybe should _actually_ use `Card` here, but who knows */}
      {children}
    </Paper>
  );
}
