import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { useNavigate } from "react-router"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setCookie } from "@/lib/utils"

const MIN_PLAYERS = 4
const MAX_PLAYERS = 7

const NEON_COLORS = [
  { value: "lime", label: "Лаймовый", className: "bg-lime-400" },
  { value: "green", label: "Зелёный", className: "bg-green-400" },
  { value: "emerald", label: "Изумрудный", className: "bg-emerald-400" },
  { value: "cyan", label: "Голубой", className: "bg-cyan-400" },
  { value: "sky", label: "Небесный", className: "bg-sky-400" },
  { value: "fuchsia", label: "Фуксия", className: "bg-fuchsia-500" },
  { value: "pink", label: "Розовый", className: "bg-pink-500" },
  { value: "rose", label: "Алый", className: "bg-rose-500" },
] as const

const nameSchema = z
  .string()
  .min(2, "От 2 до 20 символов")
  .max(20, "От 2 до 20 символов")
  .regex(
    /^[А-Яа-яЁё][А-Яа-яЁё \-]*$/,
    "Только русские буквы, тире и пробелы, имя должно начинаться с буквы!",
  )

const playerSchema = z.object({
  name: nameSchema,
  color: z.string().min(1, "Выберите цвет"),
})

const formSchema = z
  .object({
    countPlayers: z
      .number()
      .min(MIN_PLAYERS, `Минимум ${MIN_PLAYERS} игрока!`)
      .max(MAX_PLAYERS, `Максимум ${MAX_PLAYERS} игроков!`),
    players: z.array(playerSchema),
  })
  .refine(
    (data) => {
      const colors = data.players.map((p) => p.color)
      return new Set(colors).size === colors.length
    },
    { message: "Цвета игроков не должны повторяться", path: ["players"] },
  )

type FormValues = z.infer<typeof formSchema>

const makePlayer = (index: number): FormValues["players"][number] => ({
  name: "",
  color: NEON_COLORS[index % NEON_COLORS.length].value,
})

export function StartForm() {
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countPlayers: MIN_PLAYERS,
      players: Array.from({ length: MIN_PLAYERS }, (_, i) => makePlayer(i)),
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  })

  const countPlayers = form.watch("countPlayers")

  useEffect(() => {
    const target =
      Number.isFinite(countPlayers) && countPlayers >= MIN_PLAYERS
        ? Math.min(countPlayers, MAX_PLAYERS)
        : 0

    if (target > fields.length) {
      for (let i = fields.length; i < target; i++) {
        append(makePlayer(i), { shouldFocus: false })
      }
    } else if (target < fields.length) {
      for (let i = fields.length - 1; i >= target; i--) {
        remove(i)
      }
    }
  }, [countPlayers, fields.length, append, remove])

  function onSubmit(data: FormValues) {
    setCookie("countPlayers", String(data.countPlayers), 2)
    toast(`Начинаем игру на ${data.countPlayers} игрока!`, {
      position: "top-right",
    })
    navigate("/")
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Начало игры</CardTitle>
        <CardDescription>Базовые настройки для начала игры</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="countPlayers"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-count">
                    Количество игроков
                  </FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    min={MIN_PLAYERS}
                    max={MAX_PLAYERS}
                    id="form-rhf-count"
                    aria-invalid={fieldState.invalid}
                    placeholder={`От ${MIN_PLAYERS} до ${MAX_PLAYERS}`}
                    autoComplete="off"
                    onChange={(e) =>
                      field.onChange(e.target.valueAsNumber)
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {fields.map((playerField, index) => (
              <div
                key={playerField.id}
                className="rounded-lg border p-4 flex flex-col gap-4"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Игрок {index + 1}
                </p>

                <Controller
                  name={`players.${index}.name`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`player-name-${index}`}>
                        Имя
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`player-name-${index}`}
                        aria-invalid={fieldState.invalid}
                        placeholder="Имя игрока"
                        autoComplete="off"
                        maxLength={20}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name={`players.${index}.color`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`player-color-${index}`}>
                        Цвет
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={`player-color-${index}`}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Выберите цвет" />
                        </SelectTrigger>
                        <SelectContent>
                          {NEON_COLORS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`size-3 rounded-full ${color.className}`}
                                />
                                {color.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            ))}

            {form.formState.errors.players?.root && (
              <FieldError
                errors={[form.formState.errors.players.root]}
              />
            )}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.reset({
                countPlayers: MIN_PLAYERS,
                players: Array.from({ length: MIN_PLAYERS }, (_, i) =>
                  makePlayer(i),
                ),
              })
            }
          >
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
