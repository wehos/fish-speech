import * as React from 'react';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';

import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Stack from '@mui/joy/Stack';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import { useEffect, useState } from 'react';
import DialogTitle from '@mui/joy/DialogTitle';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Save from '@mui/icons-material/Save';
import Button from '@mui/joy/Button';

type ServerSettingsProps = {
  open: boolean;
  onClose: () => void;
  name?: string;
};

const SeverSettingsModal = ({
  open,
  onClose,
  name,
}: ServerSettingsProps) => {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 800);
  useEffect(() => {
    window.addEventListener('resize', () => {
      setIsSmallScreen(window.innerWidth < 800);
    });
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        color="primary"
        size="lg"
        variant="outlined"
        minWidth={isSmallScreen ? '100%' : '768px'}
      >
        <DialogTitle>
          编辑服务器配置: {name || 'Default'}
        </DialogTitle>

        <ModalClose />

        {/* Sever Configs */}
        {/* 服务器地址 */}
        <FormControl orientation='vertical'>
          <FormLabel>服务器地址</FormLabel>
          <Input defaultValue="http://localhost:8000" fullWidth endDecorator={<CheckCircle />} />
        </FormControl>

        {/* LLAMA 模型路径 */}
        <FormControl orientation='vertical'>
          <FormLabel>LLAMA 模型路径</FormLabel>
          <Input defaultValue="checkpoints/text2semantic-400m-v0.2-4k.pth" fullWidth />
        </FormControl>

        {/* Llama 配置文件 */}
        <FormControl orientation='vertical'>
          <FormLabel>Llama 配置文件</FormLabel>
          <Input defaultValue="text2semantic_finetune" fullWidth />
        </FormControl>

        {/* Tokenizer */}
        <FormControl orientation='vertical'>
          <FormLabel>Tokenizer</FormLabel>
          <Input defaultValue="fishaudio/speech-lm-v1" fullWidth />
        </FormControl>

        {/* 设备, 精度, 编译模型 */}
        <Stack direction="row" justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          <FormControl orientation='vertical'>
            <FormLabel>设备</FormLabel>
            <Select defaultValue="gpu" size="md">
              <Option value="cpu">CPU</Option>
              <Option value="gpu">GPU</Option>
            </Select>
          </FormControl>

          <FormControl orientation='vertical'>
            <FormLabel>精度</FormLabel>
            <Select defaultValue="bfloat16" size="md">
              <Option value="bfloat16">BF16</Option>
              <Option value="float16">FP16</Option>
            </Select>
          </FormControl>

          <FormControl orientation='vertical'>
            <FormLabel>编译模型</FormLabel>
            <Select defaultValue="false" size="md">
              <Option value="false">否</Option>
              <Option value="true">是</Option>
            </Select>
          </FormControl>
        </Stack>

        {/* VQGAN 模型路径 */}
        <FormControl orientation='vertical'>
          <FormLabel>VQGAN 模型路径</FormLabel>
          <Input defaultValue="checkpoints/vqgan-v1.pth" fullWidth />
        </FormControl>

        {/* VQGAN 配置文件 */}
        <FormControl orientation='vertical'>
          <FormLabel>VQGAN 配置文件</FormLabel>
          <Input defaultValue="vqgan_pretrain" fullWidth />
        </FormControl>

        {/* 保存 */}
        <Button color="primary" startDecorator={<Save />}>
          保存
        </Button>
      </ModalDialog>
    </Modal>
  )
}

export default SeverSettingsModal;
