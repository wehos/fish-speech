'use client'
import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import React from 'react';

// const AdvancedSetting = () => {
//     const [AdvancedSetting, setAdvancedSetting] = useState(false);

//     return (
//         <div>
//             <p>adv</p>
//             <Switch checked={AdvancedSetting} onCheckedChange={setAdvancedSetting} />
//             {AdvancedSetting ? <div>Advanced Setting</div> : null}
//         </div>
//     )
// }

// export { AdvancedSetting }const [serverUrl, setServerUrl] = useState("http://localhost:8000");
// const [device, setDevice] = useState("cuda");
// const [precision, setPrecision] = useState("float16");
// const [compileModel, setCompileModel] = useState(true);
// const [llamaCkptPath, setLlamaCkptPath] = useState("checkpoints/text2semantic-400m-v0.2-4k.pth");
// const [llamaConfigName, setLlamaConfigName] = useState("text2semantic_finetune");
// const [tokenizer, setTokenizer] = useState("fishaudio/speech-lm-v1");
// const [vqganCkptPath, setVqganCkptPath] = useState("checkpoints/vqgan-v1.pth");
// const [vqganConfigName, setVqganConfigName] = useState("vqgan_pretrain");
// const [error, setError] = useState("");
// const [advancedSettings, setAdvancedSettings] = useState(false);
class AdvancedSetting extends React.Component {
    checked: boolean;
    device: 'cuda' | 'cpu';
    precision: 'float16' | 'float32';
    compileModel: boolean;
    llamaCkptPath: string;
    llamaConfigName: string;
    tokenizer: string;
    vqganCkptPath: string;
    vqganConfigName: string;
    error: string;
    constructor(props: any) {
        super(props);
        this.checked = false;
        this.device = "cuda";
        this.precision = "float16";
        this.compileModel = true;
        this.llamaCkptPath = "checkpoints/text2semantic-400m-v0.2-4k.pth";
        this.llamaConfigName = "text2semantic_finetune";
        this.tokenizer = "fishaudio/speech-lm-v1";
        this.vqganCkptPath = "checkpoints/vqgan-v1.pth";
        this.vqganConfigName = "vqgan_pretrain";
        this.error = "";
    }

    render() {
        return (
            <div>
                <p>adv</p>
                {/* <Switch checked={this.checked} onCheckedChange={this.checked} /> */}
                {this.checked ? <div>Advanced Setting</div> : null}
            </div>
        )
    }
}