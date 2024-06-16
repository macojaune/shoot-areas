"use client"
import { signIn } from "next-auth/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-form-adapter"

export default function LoginForm() {
  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
    },
    onSubmit: async ({ value }) => {
      await handleEmailSignIn(value.email)
    },
    validatorAdapter: zodValidator,
  })

  const handleEmailSignIn = async (email: string) => {
    const { error } = await signIn("email", {
      email,
      redirect: false,
    })
    if (error) {
      console.log(error)
    }
  }

  const handleGoogleSignIn = async () => {
    await signIn("google")
  }
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Entre ton email pour te connecter à ton compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              await form.handleSubmit()
            }}
          >
            <div className="grid gap-4">
              <form.Field
                name="email"
                validators={{
                  onChange: z.string().email("On a besoin d'un email valide"),
                }}
                children={(field) => (
                  <>
                    <Label
                      htmlFor={field.name}
                      className="flex justify-between"
                    >
                      E-mail
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
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="nom@example.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      error={field.state.meta.errors.length > 0}
                      required
                    />
                  </>
                )}
              />
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!canSubmit}
                    className="w-full"
                  >
                    {isSubmitting ? "..." : "Connexion"}
                  </Button>
                )}
              />
            </div>
          </form>
          <div className="flex flex-row items-center gap-2">
            <div className="mt-1 h-0.5 w-full bg-l/support"></div>
            <p className="text-center text-sm">ou</p>
            <div className="mt-1 h-0.5 w-full bg-l/support"></div>
          </div>
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full"
          >
            Connexion avec Google
          </Button>
        </div>
        {/*<div className="mt-4 text-center text-sm">*/}
        {/*  Don&apos;t have an account?{" "}*/}
        {/*  <Link href="#" className="underline">*/}
        {/*    Sign up*/}
        {/*  </Link>*/}
        {/*</div>*/}
      </CardContent>
    </Card>
  )
}
