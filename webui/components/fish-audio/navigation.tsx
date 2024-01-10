"use client"

import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import ThemeChanger from "@/components/fish-audio/theme-switch"

const components: { title: string; href: string; description: string }[] = [
    {
        title: "Fine-tuning",
        href: "/finetune",
        description:
            "Fine-tune a model on your own dataset.",
    },
    {
        title: "Playground",
        href: "/playground",
        description:
            "Play with a pre-trained model.",
    },
]


export function FishNavigation() {
    return (
        <div style={{ width: '100%', alignItems: 'center', gap: 8, display: 'inline-flex' }}>
            <div style={{ width: 24, height: 24 }} >
                <img src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' alt='GitHub Logo' style={{ width: '20px', height: '20px' }} />
            </div>
            <div style={{ width: '5%', fontSize: 18, fontFamily: 'Inter', fontWeight: '600', wordWrap: 'break-word' }}>
                <Link href='https://github.com/fishaudio/fish-speech' target="_blank">
                    fish speech
                </Link>
            </div>
            <div style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'inline-flex' }}>

                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Getting Start</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                                    {components.map((component) => (
                                        <ListItem
                                            key={component.title}
                                            title={component.title}
                                            href={component.href}
                                        >
                                            {component.description}
                                        </ListItem>
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link href="https://speech.fish.audio/" legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()} target="_blank">
                                    Documentation
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <ThemeChanger />
        </div>
    )
}

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})
ListItem.displayName = "ListItem"
