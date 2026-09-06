/**
 * Dish photography.
 *
 * Every URL is an Unsplash CDN base; `dishImage()` appends sizing params so
 * each surface requests only the resolution it renders. Photographers are
 * credited in docs/credits.md. If a request fails the UI falls back to a
 * designed tile — see `components/DishImage.tsx`.
 */

export interface PhotoRef {
  url: string
  alt: string
  credit: string
}

export const PHOTOS: Record<string, PhotoRef> = {
  'jollof-rice': { url: 'https://plus.unsplash.com/premium_photo-1694141252774-c937d97641da', alt: "a black bowl filled with food on top of a table", credit: "Natalie Behn" },
  'fried-rice': { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7', alt: "fried rice on black pan", credit: "Louis Hansel" },
  'coconut-rice': { url: 'https://plus.unsplash.com/premium_photo-1675814316651-3ce3c6409922', alt: "a bowl of white rice on a yellow background", credit: "Joshua Hoehne" },
  'ofada': { url: 'https://images.unsplash.com/photo-1664992960082-0ea299a9c53e', alt: "a bowl of food", credit: "Keesha's Kitchen" },
  'white-rice-stew': { url: 'https://plus.unsplash.com/premium_photo-1694141252132-2555bae46f50', alt: "a bowl of food that is on a table", credit: "Natalie Behn" },
  'tuwo': { url: 'https://plus.unsplash.com/premium_photo-1694383410126-eb282fcdb9f6', alt: "two black bowls filled with food on top of a table", credit: "Margaret Jaszowska" },
  'pounded-yam': { url: 'https://plus.unsplash.com/premium_photo-1714590702866-2a4123c42226', alt: "a table topped with plates and a knife and fork", credit: "Olimpia Davies" },
  'egusi': { url: 'https://plus.unsplash.com/premium_photo-1664391935474-f1e502d3ad61', alt: "a bowl of soup with a spoon in it", credit: "Getty Images" },
  'ogbono': { url: 'https://plus.unsplash.com/premium_photo-1723708871094-2c02cf5f5394', alt: "Chicken masala spicy curry recipe", credit: "Curated Lifestyle" },
  'efo-riro': { url: 'https://plus.unsplash.com/premium_photo-1703260007808-bdc648fd29b7', alt: "a bowl of spinach leaves on a table", credit: "Olimpia Davies" },
  'afang': { url: 'https://plus.unsplash.com/premium_photo-1706003920144-ca73554a6801', alt: "a bowl of soup with a spoon next to it", credit: "Monika Grabkowska" },
  'okro': { url: 'https://plus.unsplash.com/premium_photo-1664391950572-bc4b1bdd1268', alt: "a bowl of soup with dumplings in it", credit: "Getty Images" },
  'nsala': { url: 'https://plus.unsplash.com/premium_photo-1705851313909-97dbf2bf54d6', alt: "a bowl of soup with broccoli, carrots, celery,", credit: "Monika Grabkowska" },
  'eba': { url: 'https://plus.unsplash.com/premium_photo-1695297516692-82b537c62733', alt: "a plate of food on a table next to a cup of tea", credit: "Monika Borys" },
  'amala': { url: 'https://images.unsplash.com/photo-1608500218861-01091cdc501e', alt: "cooked food in white ceramic bowl", credit: "Nathan Dumlao" },
  'asun': { url: 'https://plus.unsplash.com/premium_photo-1668616815670-3755f5ddee40', alt: "a pile of raw meat sitting on top of a piece of wax paper", credit: "Pablo Merchán Montes" },
  'grilled-tilapia': { url: 'https://plus.unsplash.com/premium_photo-1701015785997-30de0ba44aa0', alt: "a grill with some fish and lemons on it", credit: "Karolina Grabowska" },
  'chicken-suya': { url: 'https://plus.unsplash.com/premium_photo-1663854478523-877ed0dde4af', alt: "a white plate topped with meat and skewers", credit: "Leighann Blackwood" },
  'peppered-snail': { url: 'https://plus.unsplash.com/premium_photo-1668143363025-a17fcc032761', alt: "a plate of food with shrimp, carrots, and potatoes", credit: "JSB Co." },
  'gizdodo': { url: 'https://images.unsplash.com/photo-1563336522-c3bd728d3b45', alt: "cooked food", credit: "Griffin Wooldridge" },
  'assorted-meat': { url: 'https://plus.unsplash.com/premium_photo-1723676421151-6581c33afc55', alt: "Homemade beef stew food photography recipe idea", credit: "Curated Lifestyle" },
  'goat-meat': { url: 'https://plus.unsplash.com/premium_photo-1726848067063-1f0f8bc8d33c', alt: "Homemade beef stew food photography recipe idea", credit: "Curated Lifestyle" },
  'croaker': { url: 'https://images.unsplash.com/photo-1665332195309-9d75071138f0', alt: "Jollof rice in a white dish with grilled fish, skewers, and fresh vegetables", credit: "Keesha's Kitchen" },
  'turkey': { url: 'https://plus.unsplash.com/premium_photo-1664391682453-546426dba581', alt: "a roasted turkey on a platter with cherries", credit: "Getty Images" },
  'ponmo': { url: 'https://plus.unsplash.com/premium_photo-1726776138836-6ba2de99c2e7', alt: "Homemade beef stew food photography recipe idea", credit: "Curated Lifestyle" },
  'cow-leg': { url: 'https://plus.unsplash.com/premium_photo-1726718451503-3b141e537a01', alt: "Pumpkin soup food photography recipe idea", credit: "Curated Lifestyle" },
  'puff-puff': { url: 'https://plus.unsplash.com/premium_photo-1756053418423-eab8d434e32a', alt: "Golden brown pastries with dark chocolate filling", credit: "Annie Spratt" },
  'chin-chin': { url: 'https://plus.unsplash.com/premium_photo-1672498193267-4f0e8c819bc8', alt: "a close up of a tray of food on a table", credit: "Davey Gravy" },
  'samosa': { url: 'https://plus.unsplash.com/premium_photo-1695297516676-04a259917c03', alt: "a plate of food on a table with a cup of green tea", credit: "Monika Borys" },
  'spring-roll': { url: 'https://plus.unsplash.com/premium_photo-1663850685202-7ef603771118', alt: "a person holding chopsticks over a plate of food", credit: "Olivie Strauss" },
  'moi-moi': { url: 'https://plus.unsplash.com/premium_photo-1761318985441-3d04d5f16f87', alt: "A single slice of bread on a white plate", credit: "Natalia Blauth" },
  'akara': { url: 'https://plus.unsplash.com/premium_photo-1692309186779-a6cc130a265a', alt: "a plate of crab cakes with lemon wedges, pickles, and pickles", credit: "Anna Jakutajc-Wojtalik" },
  'meat-pie': { url: 'https://plus.unsplash.com/premium_photo-1694981405366-0ffd13044535', alt: "a white plate topped with food on top of a wooden table", credit: "Monika Borys" },
  'fish-roll': { url: 'https://plus.unsplash.com/premium_photo-1674601031561-4e042aa3242e', alt: "a person dipping sauce into a bowl of dumplings", credit: "Kobby Mendez" },
  'dodo': { url: 'https://plus.unsplash.com/premium_photo-1714246610193-47ab117771a9', alt: "a plate of fried food next to a bowl of dipping sauce", credit: "Patrycja Jadach" },
  'yam-fries': { url: 'https://plus.unsplash.com/premium_photo-1714245923988-64da21a82a1b', alt: "a close up of a pile of fried food", credit: "Patrycja Jadach" },
  'coleslaw': { url: 'https://plus.unsplash.com/premium_photo-1692781059226-cd75729787b6', alt: "a white plate topped with a salad next to a glass of water", credit: "Monika Borys" },
  'salad': { url: 'https://plus.unsplash.com/premium_photo-1664392068994-9277c9ed4837', alt: "a person pouring dressing into a salad in a bowl", credit: "Getty Images" },
  'boiled-yam': { url: 'https://plus.unsplash.com/premium_photo-1667233386677-34d02e083468', alt: "a white bowl filled with potatoes on top of a wooden table", credit: "laura adai" },
  'zobo': { url: 'https://images.unsplash.com/photo-1765118527329-6ed7fa0d10ac', alt: "Glass mug with red beverage, cinnamon sticks, and dried fruit", credit: "Asli Dokuzeylul" },
  'chapman': { url: 'https://images.unsplash.com/photo-1557935260-03ada3026d41', alt: "clear footed glass", credit: "Peace Itimi" },
  'palm-wine': { url: 'https://images.unsplash.com/photo-1617253426949-94541a3e3353', alt: "sliced bread on brown wooden round plate beside clear glass mug", credit: "Nisha Ramesh" },
  'kunu': { url: 'https://plus.unsplash.com/premium_photo-1728467974399-62f8b0e69ab8', alt: "A glass of lemonade next to a bottle of lemonade", credit: "Olivie Strauss" },
  'smoothie': { url: 'https://plus.unsplash.com/premium_photo-1663126827264-409d695e0be7', alt: "A fresh homemade fruit smoothie, healthy juicy vitamin drink diet or vegan food concept", credit: "Getty Images" },
  'tigernut': { url: 'https://plus.unsplash.com/premium_photo-1694481100261-ab16523c4093', alt: "a glass of milk being poured into a glass", credit: "Natalie Behn" },
  'ginger-beer': { url: 'https://plus.unsplash.com/premium_photo-1725075086631-b21a5642918b', alt: "A glass filled with ice sitting on top of a table", credit: "Andrej Lišakov" },
  'soft-drink': { url: 'https://plus.unsplash.com/premium_photo-1725075086810-37e14268e5ec', alt: "A green beer bottle with water droplets on it", credit: "Andrej Lišakov" },
  'water': { url: 'https://plus.unsplash.com/premium_photo-1681284939219-acfc2faa7eb8', alt: "a bottle of water on a white background", credit: "George Dagerotip" },
  'puffpuff-icecream': { url: 'https://plus.unsplash.com/premium_photo-1690440686714-c06a56a1511c', alt: "an ice cream cone with a blue sky in the background", credit: "paul campbell" },
  'coconut-candy': { url: 'https://plus.unsplash.com/premium_photo-1700830646817-4cdfa8e81d52', alt: "a white plate topped with different types of candies", credit: "Karolina Grabowska" },
  'parfait': { url: 'https://plus.unsplash.com/premium_photo-1669680784119-1f2ac0260295', alt: "a cup of ice cream with strawberries on top", credit: "Victoria Romulo" },
  'fruit-platter': { url: 'https://plus.unsplash.com/premium_photo-1676642611795-9f1de2b99f83', alt: "a bunch of cut up fruit sitting on top of a table", credit: "Olivie Strauss" },
  'banana-bread': { url: 'https://plus.unsplash.com/premium_photo-1675171527461-b785cb1a7016', alt: "a loaf of bread sitting on top of a wooden tray", credit: "Daiga Ellaby" },
  'hero': { url: 'https://plus.unsplash.com/premium_photo-1695297516698-fd7a320a55e5', alt: "a table topped with plates of food and cups of tea", credit: "Monika Borys" },
  'restaurant': { url: 'https://plus.unsplash.com/premium_photo-1670984937809-31f03f34ccdf', alt: "a restaurant with a long table and blue chairs", credit: "Pablo Merchán Montes" },
  'suya': { url: 'https://plus.unsplash.com/premium_photo-1661310177352-f586bf23a403', alt: "delicious bbq kebab grilling on open grill, outdoor kitchen. food festival in city. tasty food roasting on ske", credit: "Getty Images" },
  'banga': { url: 'https://plus.unsplash.com/premium_photo-1667428304126-52e44e315dab', alt: "a bowl of food sitting on top of a table", credit: "Levi Meir Clancy" },
}

export type PhotoKey = keyof typeof PHOTOS

/** Sized, cropped, format-negotiated URL for a dish photo. */
export function dishImage(key: string, width = 640, height?: number): string {
  const photo = PHOTOS[key]
  if (!photo) return ''
  const h = height ? `&h=${height}` : ''
  return `${photo.url}?auto=format&fit=crop&w=${width}${h}&q=70`
}

export function photoAlt(key: string, fallback: string): string {
  return PHOTOS[key]?.alt ?? fallback
}
