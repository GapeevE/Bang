import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { deleteCookie, setCookie } from "@/lib/utils"

const formSchema = z.object({
  countPlayers: z
    .number()
    .min(4, "Минимум 4 игрока!")
    .max(7, "Максимум 7 игроков!"),
})

export function StartForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countPlayers: 4,
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    setCookie("countPlayers", String(data.countPlayers), 2);
    toast(`Начинаем игру на ${data.countPlayers} игрока: `, {
      position: "top-right"
    })
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Начало игры</CardTitle>
        <CardDescription>
          Базовые настройки для начала игры
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="countPlayers"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Количество игроков
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    min={4}
                    max={7}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="От 4 до 7"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => {
                form.reset();
                deleteCookie("countPlayers");
            }}>
            Сбросить 
          </Button>
          <Button type="submit" form="form-rhf-demo">
            Начать
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
