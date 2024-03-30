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
  const [category, setCategory] = useState("trending")

  const { data: categories, refetch } = api.category.all.useQuery({})
  const { data: placesByCategory } = api.place.byCategory.useQuery(
    {
      slug: category,
    },
    { enabled: category !== null }
  )
  return (
    <div className="">
      <ToggleGroup
        type="single"
        className="lg:my-16"
        value={category}
        onValueChange={(val) => setCategory(val)}
      >
        <ToggleGroupItem
          variant="outline"
          pill
          size="lg"
          value="trending"
          defaultChecked
        >
          Populaire
        </ToggleGroupItem>
        {categories?.map((cat) => {
          if (cat.slug === "trending") return null
          return (
            <ToggleGroupItem
              key={cat.slug}
              variant="outline"
              pill
              size="lg"
              value={cat.slug}
            >
              {cat.title}
            </ToggleGroupItem>
          )
        })}
        {/*  todo send to search page*/}
        {categories && categories?.length > 1 && (
          <Button variant="outline" pill className="h-auto px-6 py-3 text-xl">
            Autre
          </Button>
        )}
      </ToggleGroup>
      <div className="grid grid-cols-3 gap-6">
        {placesByCategory?.map(({ place }) => (
          <PlaceCard place={place} key={place.title} />
        ))}
      </div>
    </div>
  )
}
export default PlaceList
