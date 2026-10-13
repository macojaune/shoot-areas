import { SignIn } from "@clerk/tanstack-react-start"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { AuthPage } from "~/components/auth-page"
import { getSafeAuthRedirect, validateAuthSearch } from "~/lib/auth-redirect"
import { isClerkClientConfigured } from "~/lib/clerk"
import { getAuthState } from "~/server/auth"

export const Route = createFileRoute("/sign-in/$")({
  validateSearch: validateAuthSearch,
  beforeLoad: async ({ search }) => {
    const { configured, userId } = await getAuthState()
    if (userId) throw redirect({ href: getSafeAuthRedirect(search.redirect_url) })
    return { authAvailable: configured }
  },
  component: SignInPage,
})

function SignInPage() {
  const { authAvailable } = Route.useRouteContext()
  const { redirect_url } = Route.useSearch()
  const destination = getSafeAuthRedirect(redirect_url)

  return (
    <AuthPage available={authAvailable && isClerkClientConfigured()}>
      <SignIn
        routing="path"
        path="/sign-in"
        withSignUp
        forceRedirectUrl={destination}
        signUpForceRedirectUrl={destination}
      />
    </AuthPage>
  )
}
