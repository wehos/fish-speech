import exp from "constants";
import { ScrollArea } from "../ui/scroll-area";

interface FishChatMessageProps {
    name: string;
    avatar?: string;
    audioUrl?: string;
    children: React.ReactNode;
}

import AudioResult from './audioResult'

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

const FishChatMessage = ({ name, avatar, audioUrl, children }: FishChatMessageProps) => {
    return (
        <div style={{ display: 'flex', alignItems: 'left', fontSize: '16px', fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word', gap: '10px', 'marginBottom': '10px' }}>
            <Avatar style={{ marginRight: '10px' }}>
                <AvatarImage src={avatar} alt="@shadcn" />
                <AvatarFallback>{name}</AvatarFallback>
            </Avatar>
            <div>
                {audioUrl ?
                    <AudioResult audioUrl={audioUrl} name={""} />
                    : (null)}
                {children}
            </div>
        </div>
    );
};

const FishChatMessageList = ({ children }: { children: React.ReactNode }) => {
    return (
        <ScrollArea style={{ display: 'flex', flexDirection: 'column', gap: '20px', 'marginBottom': '100px', height: '60vh', }}>{children}</ScrollArea>
    )
}

export { FishChatMessage, FishChatMessageList };