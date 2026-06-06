import { slugify } from "~/lib/utils"
import { seedCategoryIfMissing } from "~/server/places"

const categoryTitles = [
  "Nature",
  "Urbain",
  "Industriel",
  "Moderne",
  "Vintage",
  "Minimaliste",
  "Chic",
  "Bohème",
  "Artisanal",
  "Tropical",
  "Mer",
  "Forêt",
  "Architecture",
  "Couleurs",
  "Coucher de soleil",
]

for (const title of categoryTitles) {
  await seedCategoryIfMissing({
    title,
    slug: slugify(title),
    description: `Spots ${title.toLowerCase()} pour shootings photo et vidéo.`,
  })
}

console.log(`Seeded ${categoryTitles.length} Shootareas categories.`)
