"use client"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import React from "react"

const PlacePhotoGrid: React.FC<{ images: { url: string; name: string }[] }> = ({
  images,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2 }}>
        <Masonry gutter={20}>
          {images.map((image, index) => (
            <img src={image.url} alt={image.name} key={"image-" + index} />
          ))}
        </Masonry>
      </ResponsiveMasonry>
    </div>
  )
}

export default PlacePhotoGrid
