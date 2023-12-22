"use client"

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { PresetSelector } from "@/components/preset-selector";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import AudioPlayer from 'react-h5-audio-player';

export default function Home() {
  const presets = [{
    id: "default",
    name: "Default",
  }];

  return (
    <div className="flex flex-col h-screen">

      {/* Header */}
      <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-14">
        <Link href="https://github.com/fishaudio/fish-speech" target="_blank">
          <h2 className="text-lg font-semibold hover:text-gray-600 cursor-pointer">
            <GitHubLogoIcon className="inline-block h-6 w-6 mr-2" />
            Fish Speech
          </h2>
        </Link>
        <div className="ml-auto flex w-1/2 space-x-2 sm:justify-end">
          <PresetSelector presets={presets} />
          <Button variant="secondary">Save</Button>
          <Button variant="secondary">Add</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>
      <Separator />

      {/* Body */}
      <div className="flex flex-row h-full items-start m-4 text-sm">
        <div className="basis-3/4 flex flex-row flex-col items-center justify-center space-y-2">
          Block 1
        </div>
        <Separator orientation="vertical" />
        <div className="basis-1/4 mx-2 flex flex-col space-y-2 justify-start items-start">
          <h2 className="text-lg font-semibold">Generated Audio</h2>
          <AudioPlayer
            autoPlay
            src="http://example.com/audio.mp3"
            onPlay={e => console.log("onPlay")}
          // other props here
          />
          <AudioPlayer
            autoPlay
            src="http://example.com/audio.mp3"
            onPlay={e => console.log("onPlay")}
          />
          <Separator />
          {/* RLHF */}
          <div className="flex flex-row w-full space-x-2">
            <Button variant="secondary">Audio 1 is better</Button>
            <Button variant="secondary">Audio 2 is better</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
