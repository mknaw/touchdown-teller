import Box from '@mui/material/Box';
import Slider, { SliderProps } from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

type LabeledSliderProps = {
  label: string;
  onClick?: () => void;
} & SliderProps;

export default function LabeledSlider({
  label,
  onClick,
  ...props
}: LabeledSliderProps) {
  const className = onClick ? 'cursor-pointer' : '';
  return (
    <Box sx={{ width: 1 }}>
      <Typography className={className} onClick={onClick}>
        {label}
      </Typography>
      <Slider {...props} />
    </Box>
  );
}
