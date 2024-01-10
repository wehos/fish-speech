'use client'

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import React, { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { text } from "stream/consumers";
import { Input } from "@/components/ui/input"
// import { AdvancedSetting } from "@/components/fish-audio/adv-setting"
import { UseReferenceAudio } from "@/components/fish-audio/reference-audio"

// import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
    MainContainer,
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
} from "@chatscope/chat-ui-kit-react";

interface FishSelectProps {
    name: string;
    defaultValue: string;
    options: string[];
    setValue: (value: string) => void;
}
import { FishChatContainer } from "@/components/fish-audio/message-container";
import { FishChatMessage, FishChatMessageList } from "@/components/fish-audio/message";
import { FishChatMessageInput } from "@/components/fish-audio/message-input";


const FishSelect = ({ name, defaultValue, options, setValue }: FishSelectProps) => {
    const [value, _setValue] = React.useState(defaultValue);

    React.useEffect(() => {
        setValue(value);
    }, [value, setValue]);

    return (
        <Select onValueChange={(value) => setValue(value)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={name} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem value={option}>{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

const Playground = () => {
    const [testValue, setTestValue] = React.useState('');


    // const test = FishSelect({ name: 'test', defaultValue: 'test', options: ['test', 'test2'], setValue: setTestValue })
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '80%', width: '80%', margin: '10px' }}>
            <FishChatContainer>
                <FishChatMessageList>
                    <FishChatMessage
                        name="You"
                        avatar=""
                    >
                        Hi, I'm a message
                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        Hi, I'm a Fish
                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        Hi, I'm a Fish
                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl="/test"
                    >
                        Hi, I'm a Fish
                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                    <FishChatMessage
                        avatar='/FishLogo2.png'
                        name="Fish"
                        audioUrl=""
                    >
                        要求
                        GPU内存: 2GB (用于推理), 16GB (用于微调)
                        系统: Linux (全部功能), Windows (仅推理, 不支持 flash-attn, 不支持 torch.compile)
                        因此, 我们强烈建议 Windows 用户使用 WSL2 或 docker 来运行代码库.

                        设置

                        # 创建一个 python 3.10 虚拟环境, 你也可以用 virtualenv
                        conda create -n fish-speech python=3.10
                        conda activate fish-speech

                        # 安装 pytorch nightly 版本
                        pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu121

                        # 安装 flash-attn (适用于linux)
                        pip3 install ninja && MAX_JOBS=4 pip3 install flash-attn --no-build-isolation

                        # 安装 fish-speech
                        pip3 install -e .
                        更新日志
                        2023/12/28: 添加了 lora 微调支持.
                        2023/12/27: 添加了 gradient checkpointing, causual sampling 和 flash-attn 支持.
                        2023/12/19: 更新了 Webui 和 HTTP API.
                        2023/12/18: 更新了微调文档和相关例子.
                        2023/12/17: 更新了 text2semantic 模型, 支持无音素模式.
                        2023/12/13: 测试版发布, 包含 VQGAN 模型和一个基于 LLAMA 的语言模型 (只支持音素).
                        致谢

                    </FishChatMessage>
                </FishChatMessageList>
            </FishChatContainer>
            <FishChatMessageInput onSendMessage={undefined} onFileUpload={undefined} />
        </div>
    )

}

export default Playground