"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function EmailLoginForm() {
  const [email, setEmail] = useState("")
  return (
    <div>
      <label>
        Email
        <input
          type="email"
          name="email"
          placeholder="Ton e-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button onClick={() => signIn("email", { email })}>Connexion</button>
    </div>
  )
}
