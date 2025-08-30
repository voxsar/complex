import { Product } from "../entities/Product";
import { Category } from "../entities/Category";

export function translateProduct(product: Product, locale: string): Product {
  const translations = product.metadata?.translations?.[locale];
  if (translations) {
    return {
      ...product,
      title: translations.title || product.title,
      description: translations.description || product.description,
      shortDescription: translations.shortDescription || product.shortDescription,
    } as Product;
  }
  return product;
}

export function translateCategory(category: Category, locale: string): Category {
  const translations = category.metadata?.translations?.[locale];
  if (translations) {
    return {
      ...category,
      name: translations.name || category.name,
      description: translations.description || category.description,
    } as Category;
  }
  return category;
}
