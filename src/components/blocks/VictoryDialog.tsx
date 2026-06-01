import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useGame } from "@/lib/useGame";

export default function VictoryDialog() {
    const { game, setGame } = useGame();
    const navigate = useNavigate();

    const result = game?.result ?? null;
    if (!game || !result) return null;

    const newGame = () => {
        setGame(null);
        navigate("/start");
    };

    // Скачать отчёт партии (history) текстовым файлом.
    const downloadReport = () => {
        const lines = [
            "Отчёт партии «Бэнг!»",
            "====================",
            "",
            ...game.history,
            "",
            `Итог: победа стороны «${result.side}» — ${result.winner.name} (${result.winner.role?.name}).`,
        ];
        const blob = new Blob([lines.join("\n")], {
            type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bang-report.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Победа стороны «{result.side}»!</DialogTitle>
                    <DialogDescription>
                        Поздравляем, {result.winner.name} ({result.winner.role?.name})!
                        Цель выполнена.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button onClick={newGame}>Новая игра</Button>
                    <Button variant="outline" onClick={downloadReport}>
                        Загрузить отчёт партии
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
