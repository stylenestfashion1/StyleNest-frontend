import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categoryImageFallback } from "../utils/categoryImage";

export function CategoryHeroTile({ category, gender, blurb }) {
  const image = category.imageUrl || categoryImageFallback(category.name, gender);
  return (
    <Link
      to={`/products?gender=${gender}&categoryId=${category.id}`}
      className="group hairline-card zoom-media relative block h-full min-h-[380px]"
    >
      <img src={image} alt={category.name} loading="lazy" className="h-full w-full object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-card/85 p-6 backdrop-blur">
        {blurb && <p className="label-xs text-accent">{blurb}</p>}
        <h2 className="mt-2 text-3xl">{category.name}</h2>
      </div>
    </Link>
  );
}

export function CategoryTile({ category, gender }) {
  const image = category.imageUrl || categoryImageFallback(category.name, gender);
  return (
    <Link to={`/products?gender=${gender}&categoryId=${category.id}`} className="group hairline-card zoom-media relative block h-full min-h-[200px]">
      <img src={image} alt={category.name} loading="lazy" className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-card/85 px-4 py-3 backdrop-blur">
        <span className="display text-lg">{category.name}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default CategoryTile;
