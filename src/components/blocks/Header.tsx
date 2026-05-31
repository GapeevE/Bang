import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadFreeIcons } from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { deleteCookie } from "@/lib/utils";

export default function Header() {
    return (
        <header className="flex flex-row justify-start items-center px-5 py-5 gap-5 bg-zinc-800"> 
            <h1 className="font-black text-red-700 text-4xl">БЭНГ!</h1>
            <Tooltip>
                <TooltipContent>Новая игра!</TooltipContent>
                <TooltipTrigger asChild>
                    <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => {
                            console.log('restart tap');
                            deleteCookie("countPlayers");
                        }}
                    >
                        <HugeiconsIcon icon={ ReloadFreeIcons } />
                    </Button>
                </TooltipTrigger>
            </Tooltip>
        </header>
    )
}