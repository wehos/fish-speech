'use client'
import Image from 'next/image'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import React, { useState } from "react";



export default function Home() {
    const [serverUrl, setServerUrl] = useState("http://localhost:8000");
    const [device, setDevice] = useState("cuda");
    const [precision, setPrecision] = useState("float16");
    const [compileModel, setCompileModel] = useState(true);
    const [llamaCkptPath, setLlamaCkptPath] = useState("checkpoints/text2semantic-400m-v0.2-4k.pth");
    const [llamaConfigName, setLlamaConfigName] = useState("text2semantic_finetune");
    const [tokenizer, setTokenizer] = useState("fishaudio/speech-lm-v1");
    const [vqganCkptPath, setVqganCkptPath] = useState("checkpoints/vqgan-v1.pth");
    const [vqganConfigName, setVqganConfigName] = useState("vqgan_pretrain");
    const [error, setError] = useState("");

    const handleLoadModel = async () => {
        // Define your model loading logic here
        // This is where you would call your API or backend service
        setError(""); // Reset error on new load attempt

        try {
            // Simulate API call
            console.log("Loading model with configuration: ", {
                serverUrl,
                device,
                precision,
                compileModel,
                llamaCkptPath,
                llamaConfigName,
                tokenizer,
                vqganCkptPath,
                vqganConfigName,
            });

            // Simulate a successful load
            alert("Model loaded successfully!"); // Replace with actual API call logic
        } catch (error) {
            setError("Failed to load the model"); // Set error state
        }
    };
    let loadModel = async () => { }

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">

            <div style={{ width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
                <div style={{ width: '100%', color: '#0F172A', fontSize: 18, fontFamily: 'Inter', fontWeight: '600', lineHeight: 2, wordWrap: 'break-word' }}>
                    <Link href="/" className={buttonVariants({ variant: "outline" })}>Back to home</Link>
                </div>
            </div>

            <div style={{ width: '100%', textAlign: 'center', color: '#0F172A', fontSize: 48, fontFamily: 'Inter', fontWeight: '800', wordWrap: 'break-word' }}>Train</div>

            <div className="container" style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }} >
                {/*this need to be in form */}
                {/* <Link href="/">← Back to home</Link> */}
                {/* add Select for device: cuda or cpu */}
                <div className="leftAlign" style={{ width: '30%' }} >

                    <div>
                        <Label>服务器地址:</Label>
                        <Input type="text" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
                    </div>

                    <div>
                        <Label>设备:</Label>
                        <Select onValueChange={(value) => setDevice(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cpu">CPU</SelectItem>
                                <SelectItem value="cuda">CUDA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>精度:</Label>
                        <Select onValueChange={(value) => setPrecision(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select precision" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bfloat16">BFLOAT16</SelectItem>
                                <SelectItem value="float16">FLOAT16</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>编译模型:</Label>
                        {/* <Input type="checkbox" checked={compileModel} onChange={(e) => setCompileModel(e.target.checked)} /> */}
                        <Checkbox checked={compileModel} onChange={() => setCompileModel(!compileModel)} />
                    </div>


                    <div>
                        <button onClick={handleLoadModel}>加载模型</button>
                    </div>

                    {error && <div style={{ color: 'red' }}>{error}</div>}
                    <div>
                        <Label>Llama 模型路径:</Label>
                        <Input
                            type="text"
                            value={llamaCkptPath}
                            onChange={(e) => setLlamaCkptPath(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Llama 配置文件:</Label>
                        <Input
                            type="text"
                            value={llamaConfigName}
                            onChange={(e) => setLlamaConfigName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Tokenizer:</Label>
                        <Input
                            type="text"
                            value={tokenizer}
                            onChange={(e) => setTokenizer(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>VQGAN 模型路径:</Label>
                        <Input
                            type="text"
                            value={vqganCkptPath}
                            onChange={(e) => setVqganCkptPath(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>VQGAN 配置文件:</Label>
                        <Input
                            type="text"
                            value={vqganConfigName}
                            onChange={(e) => setVqganConfigName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Button variant="secondary" onClick={loadModel}>加载模型</Button>
                    </div>
                    {error && <div style={{ color: 'red' }}>{error}</div>}
                </div>
            </div>
        </main>
    )
}
