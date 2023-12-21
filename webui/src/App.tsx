import * as React from 'react';
import { CssVarsProvider } from '@mui/joy/styles';
import Button from '@mui/joy/Button';
import { styled } from '@mui/joy/styles';
import Sheet from '@mui/joy/Sheet';
import Grid from '@mui/joy/Grid';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Stack from '@mui/joy/Stack';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import Link from '@mui/joy/Link';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import Add from '@mui/icons-material/Add';
import CheckBox from '@mui/icons-material/CheckBox';
import Divider from '@mui/joy/Divider';
import Textarea from '@mui/joy/Textarea';
import { useEffect, useState } from 'react';
import Settings from '@mui/icons-material/Settings';
import Switch from '@mui/joy/Switch';
import Header from './components/Header';
import SeverSettingsModal from './components/ServerSettings';
import Delete from '@mui/icons-material/Delete';
import Load from '@mui/icons-material/CloudUpload';

export default function App() {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 600);
  const [isEditingSeverConfigs, setIsEditingSeverConfigs] = useState(false);
  useEffect(() => {
    window.addEventListener('resize', () => {
      setIsSmallScreen(window.innerWidth < 600);
    });
  }, []);

  const labelOrientation = isSmallScreen ? 'vertical' : 'horizontal';

  return (
    <CssVarsProvider defaultMode="system">
      <Stack direction="column" justifyContent="center" alignItems="center" spacing={2} sx={{ p: 4 }}>
        <Header />

        <Card variant='soft' sx={{ width: '100%' }}>
          <Stack
            direction="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            spacing={2}
            width="100%"
          >
            <FormControl orientation="horizontal">
              <FormLabel>当前模型</FormLabel>
              <Select defaultValue="default" size="md">
                <Option value="default">Default</Option>
              </Select>
              <Button
                color="primary"
                startDecorator={<Settings />}
                sx={{ ml: 1 }}
                onClick={() => setIsEditingSeverConfigs(!isEditingSeverConfigs)}
              >
                编辑
              </Button>
              <Button color="primary" startDecorator={<Add />} sx={{ ml: 1 }}>
                添加
              </Button>
              <Button color="danger" startDecorator={<Delete />} sx={{ ml: 1 }}>
                删除
              </Button>
              <Button color="primary" startDecorator={<Load />} sx={{ ml: 1 }}>
                加载模型
              </Button>
            </FormControl>
            <SeverSettingsModal open={isEditingSeverConfigs} onClose={() => setIsEditingSeverConfigs(false)} />
          </Stack>
        </Card>
        <Card variant='soft' sx={{ width: '100%' }}>
          <Sheet sx={{ p: 2, border: '1px solid' }}>
            Hello World
          </Sheet>
        </Card>
      </Stack>
    </CssVarsProvider>
  );
}
