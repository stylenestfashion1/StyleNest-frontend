import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as categoriesApi from "../api/categories";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import ProductListing from "./ProductListing";

/**
 * The clean public category route -- /women/{categorySlug}, /men/{categorySlug}
 * -- e.g. /women/kurti. Resolves the category by its full, gender-prefixed
 * slug (see CategoryServiceImpl.buildSlug: "women-kurti", not the bare
 * "kurti") and then renders the exact same listing/filter logic as the
 * generic /products?gender=&categoryId= route, just seeded with the
 * resolved gender/categoryId instead of reading them from the query string.
 * Dynamic filters (size, color, price, sort) still live in the query string
 * on top of this path, e.g. /women/kurti?size=M -- only the primary
 * category browse itself gets a clean path.
 */
export default function CategoryListing({ gender }) {
  const { categorySlug } = useParams();
  const fullSlug = `${gender.toLowerCase()}-${categorySlug}`;

  const categoryQuery = useQuery({
    queryKey: ["category", "slug", fullSlug],
    queryFn: () => categoriesApi.getCategoryBySlug(fullSlug),
  });

  if (categoryQuery.isLoading) return <LoadingState label="Loading category" />;
  if (categoryQuery.isError || !categoryQuery.data) return <ErrorState message="Category not found." />;

  return (
    <ProductListing
      overrideGender={gender}
      overrideCategoryId={categoryQuery.data.id}
      overrideCategoryName={categoryQuery.data.name}
    />
  );
}
