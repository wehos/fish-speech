import { MouseEvent, useState, useEffect } from "react";

interface AudioResultProps {
    name: string;
    audioUrl: string | null;
}
const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${formattedSeconds}`;
};

const AudioResult = ({ name, audioUrl }: AudioResultProps) => {
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const handleAudioPlay = () => {
        const audioElement = document.getElementById(`audio-element-${name}`) as HTMLAudioElement;
        if (audioElement) {
            setIsPlaying(true);
            audioElement.play();
        }
    };

    const handleAudioPause = () => {
        const audioElement = document.getElementById(`audio-element-${name}`) as HTMLAudioElement;
        if (audioElement) {
            setIsPlaying(false);
            audioElement.pause();
        }
    };

    const handleAudioTimeUpdate = () => {
        const audioElement = document.getElementById(`audio-element-${name}`) as HTMLAudioElement;
        if (audioElement) {
            setAudioCurrentTime(audioElement.currentTime);
        }
    };

    const handleAudioLoadedMetadata = () => {
        const audioElement = document.getElementById(`audio-element-${name}`) as HTMLAudioElement;
        if (audioElement) {
            setAudioDuration(audioElement.duration);
        }
    };

    const handleAudioSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        const audioElement = document.getElementById(`audio-element-${name}`) as HTMLAudioElement;
        if (audioElement) {
            audioElement.currentTime = Number(event.target.value);
            setAudioCurrentTime(audioElement.currentTime);
        }
    };

    const onDownload = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (audioUrl) {
            let link = document.createElement("a");
            link.href = audioUrl;
            link.download = `${name}.wav`;
            document.body.appendChild(link);
            link.click();
        }
    };

    const handleNoUrl = () => {
        useEffect(() => {
            setAudioCurrentTime(0);
            setAudioDuration(0);
            setIsPlaying(false);
        }, []);
        return null;
    };

    return (
        <>
            {
                audioUrl ? (
                    <>
                        <audio
                            id={`audio-element-${name}`}
                            src={audioUrl}
                            onTimeUpdate={handleAudioTimeUpdate}
                            onLoadedMetadata={handleAudioLoadedMetadata}
                        />
                        <div className="play-wrapper">
                            <span>{name}</span>
                            <button className="play-audio" onClick={isPlaying ? handleAudioPause : handleAudioPlay}>
                                {isPlaying ?
                                    (
                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                            <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                                            <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="24" height="24">
                                            <path d="M3 22v-20l18 10-18 10z" fill="currentColor" />
                                        </svg>
                                    )}
                            </button>
                            <input
                                type="range"
                                min={0}
                                max={audioDuration}
                                value={audioCurrentTime}
                                onChange={handleAudioSeek}
                            />
                        </div>
                        <div className="time-wrapper">
                            <span>{formatTime(audioCurrentTime)}</span>
                            <span>/</span>
                            <span>{formatTime(audioDuration)}</span>
                        </div>
                        <div>
                            <button onClick={onDownload} disabled={!audioUrl}>Download</button>
                        </div>
                    </>) :
                    handleNoUrl()
            }
        </>);
}

export default AudioResult;