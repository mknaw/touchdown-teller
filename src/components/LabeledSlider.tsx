import Box from '@mui/material/Box';
import Slider, { SliderProps } from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

type LabeledSliderProps = { label: string } & SliderProps;

export default function LabeledSlider({ label, ...props }: LabeledSliderProps) {
  return (
    <Box sx={{ width: 1 }}>
      <Typography>{label}</Typography>
      <Slider {...props} />
    </Box>
  );
}
