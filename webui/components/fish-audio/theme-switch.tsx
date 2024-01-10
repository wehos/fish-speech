'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const systemIcon =
    <Image
        src="/icons/setting.svg"
        alt="System"
        width={26}
        height={26}
    />
const darkIcon =
    <Image
        src="/icons/moon.svg"
        alt="Dark"
        width={26}
        height={26}
    />
const lightIcon =
    <Image
        src="/icons/sun.svg"
        alt="Light"
        width={26}
        height={26}
    />
const ThemeSwitch = () => {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <Select onValueChange={(value) => setTheme(value)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
                {/* <SelectItem value="system">{systemIcon}</SelectItem>
                <SelectItem value="dark">{darkIcon}</SelectItem>
                <SelectItem value="light">{lightIcon}</SelectItem> */}
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
            </SelectContent>
        </Select>
    )
}

export default ThemeSwitch