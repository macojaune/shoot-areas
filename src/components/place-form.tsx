"use client"
import { useForm } from "@tanstack/react-form"
import { zodValidator } from "@tanstack/zod-form-adapter"
import { z } from "zod"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { api } from "~/trpc/react"
import { useRouter } from "next/navigation"

const PlaceForm = () => {
  const placeholderDesc =
    "Écris nous toutes les infos possibles, comment y aller, les détails à savoir et ton retour d'expérience…\n" +
    "(ex: On peut y rentrer en voiture, l'entrée est après la boite " +
    "aux lettres jaune, le voisin est un peu mako, il y a des bœufs " +
    "en liberté, à éviter s'il pleut etc.)"

  //todo fetch countries from db
  const { data: countries, isLoading } = api.country.all.useQuery()

  const router = useRouter()
  const { mutate, isPending } = api.place.create.useMutation({
    onSuccess: (data) => {
      console.log("success", data)
      //todo redirect to place page
      // router.push("/")
    },
    onError: (error) => {
      console.error("error", error)
    },
  })
  const form = useForm({
    defaultValues: {
      title: "",
      address: "",
      country: "",
      city: "",
      description: placeholderDesc,
      accessibility: "3",
      traffic: "3",
      mark: "3",
      isPublic: true,
    },
    onSubmit: ({ value }) => {
      mutate(value)
    },
    validatorAdapter: zodValidator,
  })
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        await form.handleSubmit()
      }}
      className="my-8 space-y-3 lg:mx-auto lg:w-2/3"
    >
      <form.Field
        name="title"
        validators={{
          onBlur({ value }) {
            if (value === "") return "Le nom du lieu est plutôt essentiel"
          },
          onChange: z
            .string()
            .trim()
            .min(5, "Il faudra faire un peu plus" + " long"),
        }}
        children={(field) => {
          return (
            <div className="flex flex-col gap-y-2 transition-all duration-200 ease-in">
              <Label htmlFor={field.name} className="flex justify-between">
                Nom du lieu
                {field.state.meta.errors?.length > 0 && (
                  <em
                    role="alert"
                    className="text-xs font-medium not-italic text-destructive"
                  >
                    {
                      field.state.meta.errors?.[
                        field.state.meta.errors.length - 1
                      ]
                    }
                  </em>
                )}
              </Label>
              <Input
                type="text"
                name={field.name}
                id={field.name}
                placeholder={"Sous le pont de l'alliance"}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors.length > 0}
                required
              />
            </div>
          )
        }}
      />
      <form.Field
        name="address"
        validators={{
          onBlur({ value }) {
            if (value === "") return ""
          },
          onChange: z
            .string()
            .trim()
            .min(5, "Il faudra faire un peu plus" + " long"),
        }}
        children={(field) => {
          return (
            <div className="flex flex-col gap-y-2 transition-all duration-200 ease-in">
              <Label htmlFor={field.name} className="flex justify-between">
                Adresse
                {field.state.meta.errors?.length > 0 && (
                  <em
                    role="alert"
                    className="text-xs font-medium not-italic text-destructive"
                  >
                    {
                      field.state.meta.errors?.[
                        field.state.meta.errors.length - 1
                      ]
                    }
                  </em>
                )}
              </Label>
              <Input
                type="text"
                name={field.name}
                id={field.name}
                placeholder={"12 Rue du pape"}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors.length > 0}
                required
              />
            </div>
          )
        }}
      />
      <div className="grid grid-cols-3 gap-x-3">
        <form.Field
          name="country"
          validators={{
            onBlur({ value }) {
              if (value === "") return "Ce serait bien qu'on puisse y aller"
            },
          }}
          children={(field) => {
            return (
              <div className="flex flex-col gap-y-2 transition-all duration-200 ease-in">
                <Label
                  htmlFor={field.name}
                  className="flex flex-wrap justify-between gap-y-2"
                >
                  Pays
                  {field.state.meta.errors?.length > 0 && (
                    <em
                      role="alert"
                      className="text-xs font-medium not-italic text-destructive"
                    >
                      {
                        field.state.meta.errors?.[
                          field.state.meta.errors.length - 1
                        ]
                      }
                    </em>
                  )}
                </Label>
                <Select
                  name={field.name}
                  defaultValue={field.state.value}
                  onValueChange={(val) => field.handleChange(val)}
                  onOpenChange={(isOpen) => !isOpen && field.handleBlur()}
                  required
                >
                  <SelectTrigger error={field.state.meta.errors.length > 0}>
                    <SelectValue placeholder="Choisis un Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map((country) => (
                      <SelectItem
                        value={country.id.toString()}
                        key={country.id}
                      >
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }}
        />
        <form.Field
          name="city"
          validators={{
            onChangeListenTo: ["country"],
            onChange({ value, fieldApi }) {
              if (value === "") return "Mieux vaut être précis"
              if (
                !countries
                  .find(
                    (c) =>
                      c.id === parseInt(fieldApi.form.getFieldValue("country"))
                  )
                  ?.cities.find((ci) => ci.id === parseInt(value))
              )
                return "Pense à choisir une ville"
            },
            onBlur({ value }) {
              if (value === "") return "Mieux vaut être précis"
            },
          }}
          children={(field) => {
            return (
              <div className="flex flex-col gap-y-2 transition-all duration-200 ease-in">
                <Label
                  htmlFor={field.name}
                  className="flex flex-wrap justify-between gap-y-2"
                >
                  Ville
                  {field.state.meta.errors?.length > 0 && (
                    <em
                      role="alert"
                      className="text-xs font-medium not-italic text-destructive"
                    >
                      {
                        field.state.meta.errors?.[
                          field.state.meta.errors.length - 1
                        ]
                      }
                    </em>
                  )}
                </Label>
                <Select
                  name={field.name}
                  defaultValue={field.state.value}
                  onValueChange={(val) => field.handleChange(val)}
                  onOpenChange={(isOpen) => !isOpen && field.handleBlur()}
                  required
                >
                  <SelectTrigger error={field.state.meta.errors.length > 0}>
                    <SelectValue placeholder="Choisis une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries
                      ?.find(
                        (c) =>
                          c.id === parseInt(field.form.getFieldValue("country"))
                      )
                      ?.cities.map((city) => (
                        <SelectItem value={city.id.toString()} key={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )
          }}
        />
      </div>
      <form.Field
        name="description"
        validators={{
          onBlur({ value }) {
            if (value === "") return "C'est cette partie qui fait tout le site"
            if (value === placeholderDesc) return "Un petit effort…"
          },
          onChange: z
            .string()
            .trim()
            .min(45, "Il faudra faire un peu plus" + " long"),
        }}
        children={(field) => {
          return (
            <div className="flex flex-col gap-y-2 transition-all duration-200 ease-in">
              <Label htmlFor={field.name} className="flex justify-between">
                Details
                {field.state.meta.errors?.length > 0 && (
                  <em
                    role="alert"
                    className="text-xs font-medium not-italic text-destructive"
                  >
                    {
                      field.state.meta.errors?.[
                        field.state.meta.errors.length - 1
                      ]
                    }
                  </em>
                )}
              </Label>
              <Textarea
                name={field.name}
                id={field.name}
                value={field.state.value}
                onClick={function (_e) {
                  if (field.state.value === placeholderDesc) {
                    field.setValue("")
                  }
                }}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors.length > 0}
                required
              />
            </div>
          )
        }}
      />

      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" size="lg" disabled={!canSubmit}>
              {isSubmitting || isPending ? "..." : "Valider"}
            </Button>
          )}
        />
      </div>
    </form>
  )
}

export default PlaceForm
