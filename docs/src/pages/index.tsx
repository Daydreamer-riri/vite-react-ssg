import { Link } from 'vite-react-ssg'

export default function Home() {
  return (
    <div className="flex relative items-center">
      <div className="container mx-auto px-6 flex flex-col justify-between items-center relative py-4">
        <div className="flex flex-col">
          <h1 className="text-6xl my-6 text-center dark:text-white underline underline-offset-8 underline-dashed">
            Vite React SSG
          </h1>
          <p className="max-w-3xl text-5xl md:text-6xl font-bold mx-auto dark:text-white text-gray-800 text-center py-2">
            Building fast, content focused static sites
          </p>
          <div className="flex items-center justify-center mt-4">
            <Link
              to="/docs/Getting-Started"
              className="uppercase py-2 my-2 px-4 md:mt-16 bg-transparent dark:text-gray-800 dark:bg-white hover:text-white hover:dark:bg-gray-100 hover:dark:text-gray-800 border-2 border-gray-800 text-gray-800 hover:bg-gray-800  text-md"
            >
              READ THE DOCS
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-16 py-2 my-2 px-4 md:mt-16">
            <div className="border-b-bluegray border-b p-b-4">
              <h2 className="font-600 text-2xl">Fast by default</h2>
              <p>Make sites very fast with <strong>static site generation</strong></p>
            </div>
            <div className="border-b-bluegray border-b p-b-4">
              <h2 className="font-600 text-2xl">Easy to use</h2>
              <p><strong>Out of the box</strong>, no configuration required</p>
            </div>
            <div className="border-b-bluegray border-b p-b-4">
              <h2 className="font-600 text-2xl">Vite Ecosystem</h2>
              <p>Based on Vite, it can be compatible with all the ecology</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
