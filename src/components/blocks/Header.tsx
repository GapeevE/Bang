import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReloadFreeIcons } from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGame } from "@/lib/useGame";

export default function Header() {
    const navigate = useNavigate();
    const { setGame } = useGame();

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
                            setGame(null);
                            navigate("/start");
                        }}
                    >
                        <HugeiconsIcon icon={ ReloadFreeIcons } />
                    </Button>
                </TooltipTrigger>
            </Tooltip>
        </header>
    )
}