import type { Category, Product, StoreSettings, Variant } from '@/types'

// Sample catalog used until Supabase is connected. Photos are free Unsplash stand-ins;
// real product photos get uploaded from the admin panel.

// Stand-in photos from Unsplash, saved locally in /public/stock so the site doesn't depend on their CDN.
export const unsplash = (id: string, _w?: number) => `/stock/${id}.jpg`

export const demoSettings: StoreSettings = {
  delivery_fee: 4,
  free_delivery_over: 150,
  whish_number: '03 000 000',
  omt_name: 'Just Move',
  card_enabled: false,
}

export const demoCategories: Category[] = [
  'Suits',
  'Blazers',
  'Shirts',
  'Trousers',
  'Outerwear',
  'Knitwear',
  'Dresses',
  'Shoes',
].map((name, i) => ({ id: `c${i}`, name, slug: name.toLowerCase(), sort: i }))

const cat = (slug: string) => demoCategories.find((c) => c.slug === slug)!.id

const variants = (productId: string, sizes: readonly string[], colors: readonly string[]): Variant[] =>
  colors.flatMap((color, ci) =>
    sizes.map((size, si) => ({
      id: `${productId}-${ci}-${si}`,
      product_id: productId,
      size,
      color,
      stock: (si * 3 + ci * 5) % 7 === 0 ? 0 : 3 + ((si + ci) % 6),
      sort: ci * 10 + si,
    })),
  )

const SUIT = ['46', '48', '50', '52', '54']
const TOP = ['S', 'M', 'L', 'XL', 'XXL']
const WOMEN = ['XS', 'S', 'M', 'L']
const SHOE = ['40', '41', '42', '43', '44', '45']

type Row = [string, 'men' | 'women', string, number, number | null, string[], string[], boolean, string[]]

const base: Row[] = [
  ['Midnight Slim Suit', 'men', 'suits', 289, 349, SUIT, ['Navy', 'Black'], true, ['1507679799987-c73779587ccf', '1617137968427-85924c800a22']],
  ['Windowpane Three-Piece', 'men', 'suits', 329, null, SUIT, ['Blue check'], true, ['1594938298603-c8148c4dae35', '1598808503746-f34c53b9323e']],
  ['Black Dinner Jacket', 'men', 'blazers', 219, null, SUIT, ['Black'], true, ['1617127365659-c47fa864d8bc', '1618886614638-80e3c103d31a']],
  ['Camel Soft Blazer', 'men', 'blazers', 189, 229, SUIT, ['Camel', 'Navy'], false, ['1552374196-1ab2a1c593e8']],
  ['Poplin Dress Shirt', 'men', 'shirts', 49, null, TOP, ['White', 'Sky'], false, ['1603252109303-2751441dd157', '1621072156002-e2fccdc0b176']],
  ['Pressed Shirt Trio', 'men', 'shirts', 119, 147, TOP, ['Mixed'], false, ['1602810318383-e386cc2a3ccf']],
  ['Tweed Field Coat', 'men', 'outerwear', 259, 299, TOP, ['Brown'], true, ['1505022610485-0249ba5b3675']],
  ['Leather Biker Jacket', 'men', 'outerwear', 239, null, TOP, ['Cognac'], false, ['1487222477894-8943e31ef7b2']],
  ['Merino Crew Knit', 'men', 'knitwear', 69, null, TOP, ['Burgundy', 'Black'], false, ['1506634572416-48cdfe530110']],
  ['Suede Overshirt', 'men', 'outerwear', 129, null, TOP, ['Tan'], false, ['1617114919297-3c8ddb01f599']],
  ['Double Monk Strap', 'men', 'shoes', 139, null, SHOE, ['Brown'], true, ['1533867617858-e7b97e060509', '1614252235316-8c857d38b5f4']],
  ['Check Tailored Blazer', 'women', 'blazers', 169, null, WOMEN, ['Green check'], true, ['1485968579580-b6d095142e6e']],
  ['Red Maxi Dress', 'women', 'dresses', 119, 149, WOMEN, ['Red'], true, ['1595777457583-95e059d581b8']],
  ['Wide-Leg Trouser', 'women', 'trousers', 85, null, WOMEN, ['Sand', 'Black'], false, ['1614251055880-ee96e4803393']],
  ['Wool Wrap Coat', 'women', 'outerwear', 199, null, WOMEN, ['Burgundy'], true, ['1483985988355-763728e1935b']],
  ['Sheer Black Blouse', 'women', 'dresses', 95, null, WOMEN, ['Black'], false, ['1524504388940-b1c1722653e1']],
  ['Sequin Two-Piece', 'women', 'dresses', 159, null, WOMEN, ['Ruby'], false, ['1550614000-4895a10e1bfd']],
  ['Floral Day Dress', 'women', 'dresses', 89, null, WOMEN, ['Red floral'], false, ['1572804013309-59a88b7e92f1']],
]

// Style tags for recommendations (keys of STYLES in src/lib/taste.ts).
const STYLE_TAGS: Record<string, string[]> = {
  'Midnight Slim Suit': ['classic', 'modern', 'evening'],
  'Windowpane Three-Piece': ['classic', 'statement'],
  'Black Dinner Jacket': ['evening', 'classic'],
  'Camel Soft Blazer': ['smart-casual', 'modern'],
  'Poplin Dress Shirt': ['classic', 'smart-casual'],
  'Pressed Shirt Trio': ['classic'],
  'Tweed Field Coat': ['classic', 'smart-casual'],
  'Leather Biker Jacket': ['street', 'statement'],
  'Merino Crew Knit': ['smart-casual', 'modern'],
  'Suede Overshirt': ['smart-casual', 'street'],
  'Double Monk Strap': ['classic', 'evening'],
  'Check Tailored Blazer': ['modern', 'smart-casual', 'statement'],
  'Red Maxi Dress': ['evening', 'statement'],
  'Wide-Leg Trouser': ['modern', 'smart-casual'],
  'Wool Wrap Coat': ['classic', 'modern'],
  'Sheer Black Blouse': ['evening', 'modern'],
  'Sequin Two-Piece': ['evening', 'statement'],
  'Floral Day Dress': ['smart-casual', 'street'],
}

export const demoProducts: Product[] = base.map(
  ([name, gender, category, price, compare, sizes, colors, featured, photos], i) => {
    const id = `p${i}`
    return {
      id,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description:
        'Sharp tailoring with a clean, modern line. Fully lined, finished by hand and made to move with you from day to night.',
      gender,
      category_id: cat(category),
      price,
      compare_at_price: compare,
      images: photos.map((p) => unsplash(p)),
      is_active: true,
      is_featured: featured,
      styles: STYLE_TAGS[name] ?? [],
      created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
      product_variants: variants(id, sizes, colors),
    }
  },
)
