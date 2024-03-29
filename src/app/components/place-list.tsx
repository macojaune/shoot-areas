"use client"
import { ToggleGroup, ToggleGroupItem } from "~/app/components/ui/toggle-group"
import { Button } from "~/app/components/ui/button"
import { PlaceCard } from "~/app/components/place-card"
import { useState } from "react"
import { api } from "~/trpc/react"
import { type Category } from "~/server/db/schemas"

const PlaceList: React.FC<{
  categories: Category[]
}> = ({ categories: list }) => {
  const [offset, setOffset] = useState(0)
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const { data: categories, refetch } = api.category.all.useQuery({ offset })
  const { data: placesByCategory } = api.place.byCategory.useQuery({
    id: categoryId,
  })
  return (
    <div className="">
      <ToggleGroup type="single" className="lg:my-16">
        <ToggleGroupItem
          variant="outline"
          pill
          size="lg"
          value="trending"
          defaultChecked
        >
          Populaire
        </ToggleGroupItem>
        {categories?.map((cat) => (
          <ToggleGroupItem
            key={cat.title}
            variant="outline"
            pill
            size="lg"
            value={cat.title}
          >
            {cat.title}
          </ToggleGroupItem>
        ))}
        {categories && categories?.length > 1 && (
          <Button
            variant="outline"
            pill
            className="h-auto px-6 py-3 text-xl"
            onClick={async () => {
              setOffset((old) => old + 4)
              await refetch()
            }}
          >
            Autre
          </Button>
        )}
      </ToggleGroup>
      <div className="grid grid-cols-3 gap-6">
        {placesByCategory?.map((place) => (
          <PlaceCard place={place} key={place.title} />
        ))}
      </div>
    </div>
  )
}
export default PlaceList
