"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

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

export default function LoginForm() {
  const [email, setEmail] = useState("")

  const handleEmailSignIn = async () => {
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
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button onClick={handleEmailSignIn} type="submit" className="w-full">
            Connexion
          </Button>
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
