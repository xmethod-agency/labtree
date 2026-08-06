import type { Product, SubCategory } from '@/types';

/**
 * Four packaging photos cover the whole catalog — mapped by texture, because
 * texture is what determines the primary packaging in reality.
 */
const IMAGE_BY_SUBCATEGORY: Record<SubCategory, string> = {
  Cream: '/products/cream.jpg',
  Mask: '/products/cream.jpg',
  Lotion: '/products/bottle.jpg',
  Gel: '/products/bottle.jpg',
  Shampoo: '/products/bottle.jpg',
  Foam: '/products/bottle.jpg',
  Serum: '/products/tube.jpg',
  Oil: '/products/tube.jpg',
  Balm: '/products/stick.jpg',
  Stick: '/products/stick.jpg',
};

const PACKAGING_LABEL: Record<SubCategory, string> = {
  Cream: 'Glass jar, 2-piece',
  Mask: 'Glass jar, 2-piece',
  Lotion: 'Pump bottle, mono-material',
  Gel: 'Pump bottle, mono-material',
  Shampoo: 'Pump bottle, mono-material',
  Foam: 'Foamer bottle',
  Serum: 'Airless tube with applicator',
  Oil: 'Airless tube with applicator',
  Balm: 'Twist stick, metal sleeve',
  Stick: 'Twist stick, metal sleeve',
};

export function productImage(product: Pick<Product, 'subCategory'>) {
  return IMAGE_BY_SUBCATEGORY[product.subCategory] ?? '/products/cream.jpg';
}

export function packagingLabel(product: Pick<Product, 'subCategory'>) {
  return PACKAGING_LABEL[product.subCategory] ?? 'Standard packaging';
}
