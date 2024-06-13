"use client"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import React from "react"
import Image from "next/image"

const PlacePhotoGrid: React.FC<{ images: { url: string; name: string }[] }> = ({
  images,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2 }}>
        <Masonry gutter="20">
          {images.map((image, index) => (
            <Image
              src={image.url}
              alt={image.name}
              key={"image-" + index}
              width={300}
              height={600}
            />
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  )
}

export default PlacePhotoGrid
