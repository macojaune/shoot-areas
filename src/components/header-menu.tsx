"use client"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu"
import { Button } from "~/components/ui/button"
import { signOut } from "next-auth/react"
import { type Session } from "next-auth"

const Menu = ({ session }: { session: Session | null }) => {
  return (
    <NavigationMenu className="lg:py-5">
      <NavigationMenuList>
        {session && (
          <NavigationMenuItem>
            {/*<NavigationMenuTrigger>Mon compte</NavigationMenuTrigger>*/}
            {/*<NavigationMenuContent>*/}
            {/*  <ul>*/}
            {/*    <li>*/}
            <NavigationMenuLink>
              <Button onClick={() => signOut()} variant="link-destructive">
                Déconnexion
              </Button>
            </NavigationMenuLink>
            {/*    </li>*/}
            {/*  </ul>*/}
            {/*</NavigationMenuContent>*/}
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export default Menu
