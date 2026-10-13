import { SignUp } from "@clerk/tanstack-react-start"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthPage } from "~/components/auth-page"
import { getSafeAuthRedirect, validateAuthSearch } from "~/lib/auth-redirect"
import { isClerkClientConfigured } from "~/lib/clerk"
import { getAuthState } from "~/server/auth"

export const Route = createFileRoute("/sign-up/$")({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ search }) => {
    const { configured, userId } = await getAuthState()
    if (userId) throw redirect({ href: getSafeAuthRedirect(search.redirect_url) })
    return { authAvailable: configured }
  },
  component: SignUpPage,
})

function SignUpPage() {
  const { authAvailable } = Route.useRouteContext()
  const { redirect_url } = Route.useSearch()
  const destination = getSafeAuthRedirect(redirect_url)

  return (
    <AuthPage available={authAvailable && isClerkClientConfigured()}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(destination)}`}
        forceRedirectUrl={destination}
        signInForceRedirectUrl={destination}
      />
    </AuthPage>
  )
}
