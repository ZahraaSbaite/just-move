import { unsplash } from '@/lib/demo-data'

// Brand details shown around the site. Update addresses / map links here.
export const INSTAGRAM_MEN = 'https://www.instagram.com/justmove.lb/'
export const INSTAGRAM_WOMEN = 'https://www.instagram.com/justmove_women/'

// Editorial photos. These are Unsplash stand-ins — swap for your own shoots
// (drop files in /public and use e.g. '/hero.jpg').
export const PHOTOS = {
  hero: unsplash('1618886614638-80e3c103d31a', 2000),
  men: '/instagram/feed-01.jpg',
  women: unsplash('1485968579580-b6d095142e6e', 1400),
  atelier: unsplash('1598808503746-f34c53b9323e', 1400),
  detail: unsplash('1507679799987-c73779587ccf', 1000),
  store: unsplash('1441984904996-e0b6ba687e04', 1400),
}

export const CATEGORY_PHOTOS: Record<string, string> = {
  suits: unsplash('1594938298603-c8148c4dae35', 800),
  blazers: unsplash('1552374196-1ab2a1c593e8', 800),
  shirts: unsplash('1603252109303-2751441dd157', 800),
  outerwear: unsplash('1505022610485-0249ba5b3675', 800),
  knitwear: unsplash('1506634572416-48cdfe530110', 800),
  dresses: unsplash('1595777457583-95e059d581b8', 800),
  shoes: unsplash('1533867617858-e7b97e060509', 800),
  trousers: unsplash('1614251055880-ee96e4803393', 800),
}

export const BRANCHES = [
  {
    name: 'Sayyed Hadi Highway',
    area: 'Dahieh, Beirut',
    map: 'https://maps.google.com/?q=33.842194,35.516605',
    photo: '/instagram/feed-05.jpg',
  },
  {
    name: 'Jdeideh Square',
    area: 'Jdeideh, Metn',
    map: 'https://maps.google.com/?q=Jdeideh+Square+Lebanon',
    photo: '/instagram/feed-02.jpg',
  },
  {
    name: 'Hamra / Verdun',
    area: 'Ras Beirut',
    map: 'https://maps.google.com/?q=Hamra+Beirut',
    photo: '/instagram/feed-06.jpg',
  },
]

export const TAGLINE = 'If there is a will, there is a way.'

// Recent @justmove.lb posts, saved from Instagram (newest first). Replace or add files in /public/instagram.
export const INSTAGRAM_POSTS = Array.from({ length: 12 }, (_, i) => `/instagram/feed-${String(i + 1).padStart(2, '0')}.jpg`)
