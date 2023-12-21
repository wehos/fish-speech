import * as React from 'react';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Link from '@mui/joy/Link';


const Header = () => (
  <Card variant='soft' sx={{ width: '100%' }}>
    <Typography level="h1">
      Fish Speech
    </Typography>
    <Typography level="title-lg">
      在线推理 Web UI, 代码仓库:
      <Link underline="always" href="https://github.com/fishaudio/fish-speech" sx={{ ml: 1 }}>
        Fish Speech
      </Link>
    </Typography>
  </Card>
);

export default Header;
