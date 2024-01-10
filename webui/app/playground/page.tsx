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

import { Input } from "@/components/ui/input"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Label } from '@/components/ui/label'
import { Checkbox } from "@/components/ui/checkbox"
import React, { useState } from "react";
import * as z from "zod"
import Playground from "@/components/fish-audio/playground"



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
    const [advancedSettings, setAdvancedSettings] = useState(false);

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


            <Playground />

            {/* <div className="container" style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', fontSize: 30, fontFamily: 'Inter', fontWeight: '800', wordWrap: 'break-word' }} > */}
            {/* </div> */}
        </main>
    )
}
