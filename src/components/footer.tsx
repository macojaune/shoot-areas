import { Button } from "~/components/ui/button"

const Footer = () => {
  return (
    <footer className="container flex min-h-20 w-full flex-col border-t border-l/support bg-l/tertiary text-white">
      <div className="flex w-full grow flex-row border-b border-l/support bg-l/secondary">
        <div className="grow p-8">
          <p className="text-4xl text-l/bg">Abonne-toi à la newsletter</p>
        </div>
        <div className="flex items-center bg-l/primary p-5">
          <div className="text-4xl text-l/accent">📩</div>
        </div>
      </div>
      <div className="grid grid-flow-row-dense grid-cols-4 grid-rows-2 p-5">
        <ul>
          <a
            href="https://github.com/macojaune/shoot-areas"
            target="_blank"
            rel="noreferrer"
            className="text-center text-lg"
          >
            :github:
          </a>
        </ul>

        <p className="col-span-full text-center font-mono text-lg">
          Catapulté avec ❤️ par{" "}
          <Button variant="link" className="p-0 text-l/bg" size="lg">
            <a href="https://marvinl.com" target="_blank">
              MarvinL.com
            </a>
          </Button>
        </p>
      </div>
    </footer>
  )
}

export default Footer
