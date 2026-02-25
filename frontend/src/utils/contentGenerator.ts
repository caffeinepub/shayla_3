// Enhanced content generator with improved multi-fallback parsing and CORS proxy handling

export interface ProductData {
  title: string;
  price: number;
  description: string;
  specs: string[];
  images: string[];
  tags: string[];
  brand: string;
  category: string;
}

export interface GeneratedContent {
  productData: ProductData;
  title: string;
  purchasePrice: number;
  salePrice: number;
  description: string;
  specs: string;
  tags: string[];
  images: string[];
  shortDescription: string;
}

// CORS proxies with fallback chain
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

export type ProgressCallback = (step: number, message: string, detail?: string) => void;

// Fetch URL with multiple CORS proxy fallbacks
async function fetchWithProxies(
  url: string,
  actor: any,
  onProgress?: ProgressCallback
): Promise<string> {
  // First try backend actor
  if (actor) {
    try {
      onProgress?.(1, 'دریافت اطلاعات', 'در حال اتصال از طریق سرور...');
      const result = await actor.fetchUrl(url);
      if (result && result.body && result.body.length > 500) {
        return result.body;
      }
    } catch (e) {
      onProgress?.(1, 'دریافت اطلاعات', 'سرور در دسترس نیست، تلاش با پروکسی...');
    }
  }

  // Try each CORS proxy sequentially
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](url);
    try {
      onProgress?.(1, 'دریافت اطلاعات', `تلاش با پروکسی ${i + 1} از ${CORS_PROXIES.length}...`);
      const response = await fetch(proxyUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fa,en;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        onProgress?.(1, 'دریافت اطلاعات', `پروکسی ${i + 1} ناموفق بود (${response.status})، تلاش بعدی...`);
        continue;
      }

      const data = await response.json().catch(() => null);
      if (data && data.contents && data.contents.length > 500) {
        return data.contents;
      }

      const text = await response.text().catch(() => '');
      if (text && text.length > 500) {
        return text;
      }

      onProgress?.(1, 'دریافت اطلاعات', `پروکسی ${i + 1} محتوای کافی برنگرداند، تلاش بعدی...`);
    } catch (e: any) {
      onProgress?.(1, 'دریافت اطلاعات', `پروکسی ${i + 1} خطا داد: ${e?.message || 'خطای ناشناخته'}، تلاش بعدی...`);
    }
  }

  throw new Error('تمام پروکسی‌ها ناموفق بودند. لطفاً اتصال اینترنت خود را بررسی کنید.');
}

// Helper: extract text by multiple CSS-like selectors from HTML string
function extractBySelectors(html: string, selectors: string[]): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  for (const selector of selectors) {
    try {
      const el = doc.querySelector(selector);
      if (el) {
        const text = el.textContent?.trim() || '';
        if (text.length > 2) return text;
      }
    } catch (_) {
      // invalid selector, skip
    }
  }
  return '';
}

// Helper: extract multiple elements
function extractAllBySelectors(html: string, selectors: string[]): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const results: string[] = [];

  for (const selector of selectors) {
    try {
      const els = doc.querySelectorAll(selector);
      els.forEach(el => {
        const text = el.textContent?.trim() || '';
        if (text.length > 2 && !results.includes(text)) {
          results.push(text);
        }
      });
      if (results.length > 0) break;
    } catch (_) {
      // skip
    }
  }
  return results;
}

// Helper: extract image URLs
function extractImages(html: string, selectors: string[]): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images: string[] = [];

  for (const selector of selectors) {
    try {
      const els = doc.querySelectorAll(selector);
      els.forEach(el => {
        const src = el.getAttribute('src') || el.getAttribute('data-src') || 
                    el.getAttribute('data-lazy') || el.getAttribute('data-original') || '';
        if (src && src.startsWith('http') && !images.includes(src)) {
          images.push(src);
        }
      });
      if (images.length > 0) break;
    } catch (_) {
      // skip
    }
  }
  return images.slice(0, 10);
}

// Clean price string to number
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove Persian/Arabic numerals and convert
  const normalized = priceStr
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[^\d]/g, '');
  const num = parseInt(normalized, 10);
  return isNaN(num) ? 0 : num;
}

// Generic content scoring algorithm
function genericContentScore(html: string): { description: string; title: string; price: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove noise elements
  ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript'].forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  // Score title candidates
  const titleCandidates = [
    ...Array.from(doc.querySelectorAll('h1')),
    ...Array.from(doc.querySelectorAll('[class*="title"]')),
    ...Array.from(doc.querySelectorAll('[class*="product-name"]')),
    ...Array.from(doc.querySelectorAll('[class*="product_name"]')),
    ...Array.from(doc.querySelectorAll('[itemprop="name"]')),
  ];

  let bestTitle = doc.title || '';
  for (const el of titleCandidates) {
    const text = el.textContent?.trim() || '';
    if (text.length > 5 && text.length < 200) {
      bestTitle = text;
      break;
    }
  }

  // Score description candidates by length and keyword density
  const priceKeywords = ['تومان', 'ریال', 'قیمت', 'price', 'تخفیف', 'موجود'];
  const descKeywords = ['ویژگی', 'مشخصات', 'توضیح', 'description', 'detail', 'feature', 'خرید', 'محصول'];

  const allParagraphs = Array.from(doc.querySelectorAll('p, [class*="desc"], [class*="detail"], [class*="content"], [itemprop="description"]'));
  
  let bestDesc = '';
  let bestScore = 0;

  for (const el of allParagraphs) {
    const text = el.textContent?.trim() || '';
    if (text.length < 50) continue;

    let score = text.length * 0.1;
    descKeywords.forEach(kw => {
      if (text.includes(kw)) score += 20;
    });
    // Penalize if too short or too long
    if (text.length > 2000) score *= 0.5;
    if (text.length > 100 && text.length < 1000) score *= 1.5;

    if (score > bestScore) {
      bestScore = score;
      bestDesc = text;
    }
  }

  // Extract price
  let price = 0;
  const priceEls = doc.querySelectorAll('[class*="price"], [itemprop="price"], [class*="قیمت"]');
  for (const el of Array.from(priceEls)) {
    const text = el.textContent?.trim() || '';
    const p = parsePrice(text);
    if (p > 1000) {
      price = p;
      break;
    }
  }

  // Fallback: search all text for price patterns
  if (price === 0) {
    const bodyText = doc.body?.textContent || '';
    const priceMatch = bodyText.match(/(\d[\d,،٬]+)\s*(تومان|ریال)/);
    if (priceMatch) {
      price = parsePrice(priceMatch[1]);
    }
  }

  return { description: bestDesc, title: bestTitle, price };
}

// Digikala parser with multiple fallback selectors
function parseDigikala(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1[class*="product-title"]',
    'h1[class*="title"]',
    '.product-title h1',
    '[data-testid="product-title"]',
    'h1.pdp-title',
    '.pdp-summary-title',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '[data-testid="price-final"]',
    '.price-final',
    '[class*="price-final"]',
    '[class*="selling-price"]',
    '.pdp-price',
    '[class*="pdp-price"]',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '[data-testid="product-description"]',
    '.product-description',
    '[class*="product-description"]',
    '.pdp-description',
    '[class*="pdp-description"]',
    '[itemprop="description"]',
    '.description-content',
    '[class*="description"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '[data-testid="product-specifications"] tr',
    '.product-specifications tr',
    '[class*="specifications"] tr',
    '[class*="spec-table"] tr',
    '.pdp-specifications tr',
    'table.specifications tr',
    '[class*="attribute"] li',
  ]);

  const images = extractImages(html, [
    '[data-testid="product-gallery"] img',
    '.product-gallery img',
    '[class*="gallery"] img',
    '.pdp-gallery img',
    '[class*="product-image"] img',
    '.swiper-slide img',
    '[class*="slider"] img',
  ]);

  const brand = extractBySelectors(html, [
    '[data-testid="product-brand"]',
    '.product-brand',
    '[class*="brand"]',
    '[itemprop="brand"]',
  ]);

  return {
    title,
    price: parsePrice(price),
    description,
    specs,
    images,
    brand,
  };
}

// Basalam parser
function parseBasalam(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1.product-title',
    'h1[class*="title"]',
    '.product-header h1',
    '[class*="product-name"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.price-value',
    '[class*="price-value"]',
    '[class*="final-price"]',
    '.product-price',
    '[class*="product-price"]',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '.product-description',
    '[class*="product-description"]',
    '.description-text',
    '[class*="description-text"]',
    '[itemprop="description"]',
    '.product-details',
    '[class*="product-details"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '.product-attributes li',
    '[class*="attributes"] li',
    '.product-specs li',
    '[class*="specs"] li',
    'table.product-table tr',
    '[class*="specification"] tr',
  ]);

  const images = extractImages(html, [
    '.product-gallery img',
    '[class*="gallery"] img',
    '.product-images img',
    '[class*="product-image"] img',
    '.swiper-slide img',
  ]);

  return {
    title,
    price: parsePrice(price),
    description,
    specs,
    images,
  };
}

// Torob parser
function parseTorob(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1.product-name',
    'h1[class*="product"]',
    '.product-title h1',
    '[class*="product-title"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.cheapest-price',
    '[class*="cheapest"]',
    '.price-value',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '.product-description',
    '[class*="description"]',
    '.product-info',
    '[class*="product-info"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '.product-specs tr',
    '[class*="specs"] tr',
    '.specifications tr',
    '[class*="specification"] li',
  ]);

  const images = extractImages(html, [
    '.product-image img',
    '[class*="product-image"] img',
    '.gallery img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Shylaa.ir parser
function parseShylaa(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1.product_title',
    'h1.entry-title',
    '.product_title',
    '[class*="product-title"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.price ins .amount',
    '.price .amount',
    '[class*="price"] .amount',
    '.woocommerce-Price-amount',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '.woocommerce-product-details__short-description',
    '.product-short-description',
    '#tab-description',
    '.woocommerce-Tabs-panel--description',
    '[class*="description"]',
    '.entry-content',
  ]);

  const specs = extractAllBySelectors(html, [
    '.woocommerce-product-attributes tr',
    '.shop_attributes tr',
    '[class*="attributes"] tr',
    '.product-attributes tr',
  ]);

  const images = extractImages(html, [
    '.woocommerce-product-gallery img',
    '.product-gallery img',
    '[class*="product-gallery"] img',
    '.wp-post-image',
    'img.attachment-woocommerce_single',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Sheypoor parser
function parseSheypoor(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1.post-title',
    'h1[class*="title"]',
    '.listing-title h1',
    '[class*="post-title"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.price-value',
    '[class*="price-value"]',
    '.listing-price',
    '[class*="listing-price"]',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '.listing-description',
    '[class*="listing-description"]',
    '.post-description',
    '[class*="description"]',
    '.listing-body',
  ]);

  const specs = extractAllBySelectors(html, [
    '.listing-attributes li',
    '[class*="attributes"] li',
    '.listing-details li',
  ]);

  const images = extractImages(html, [
    '.listing-gallery img',
    '[class*="gallery"] img',
    '.listing-image img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Snapp Shop parser
function parseSnappShop(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1[class*="ProductTitle"]',
    'h1[class*="product-title"]',
    '[class*="ProductName"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '[class*="FinalPrice"]',
    '[class*="final-price"]',
    '[class*="Price"]',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '[class*="ProductDescription"]',
    '[class*="product-description"]',
    '[class*="Description"]',
    '[class*="description"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '[class*="Specification"] tr',
    '[class*="specification"] tr',
    '[class*="Attribute"] li',
  ]);

  const images = extractImages(html, [
    '[class*="ProductGallery"] img',
    '[class*="product-gallery"] img',
    '[class*="Gallery"] img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Amazon parser
function parseAmazon(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    '#productTitle',
    '#title',
    'h1#title',
    '[data-feature-name="title"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price-whole',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '#productDescription',
    '#feature-bullets',
    '#aplus',
    '[data-feature-name="productDescription"]',
    '[class*="description"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '#productDetails_techSpec_section_1 tr',
    '#productDetails_detailBullets_sections1 tr',
    '.prodDetTable tr',
    '#detailBullets_feature_div li',
  ]);

  const images = extractImages(html, [
    '#imgTagWrapperId img',
    '#altImages img',
    '.imgTagWrapper img',
    '[data-action="main-image-click"] img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// eBay parser
function parseEbay(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1.x-item-title__mainTitle',
    '.x-item-title h1',
    '#itemTitle',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '.x-price-primary',
    '#prcIsum',
    '.notranslate',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '#desc_div',
    '.item-description',
    '[class*="description"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '.ux-layout-section--features li',
    '.itemAttr tr',
    '[class*="item-specifics"] tr',
  ]);

  const images = extractImages(html, [
    '#icImg',
    '.ux-image-carousel img',
    '[class*="image-carousel"] img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// AliExpress parser
function parseAliExpress(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1[class*="title"]',
    '.product-title h1',
    '[class*="product-title"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '[class*="price-current"]',
    '[class*="uniform-banner-box-price"]',
    '[class*="product-price"]',
    '[class*="price"]',
  ]);

  const description = extractBySelectors(html, [
    '[class*="product-description"]',
    '[class*="description"]',
    '[class*="detail"]',
  ]);

  const specs = extractAllBySelectors(html, [
    '[class*="product-prop"] li',
    '[class*="specification"] li',
    '[class*="sku-item"]',
  ]);

  const images = extractImages(html, [
    '[class*="gallery"] img',
    '[class*="product-image"] img',
    '.magnifier-image',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Alibaba parser
function parseAlibaba(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1[class*="title"]',
    '.product-title h1',
    '[class*="subject"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '[class*="price"]',
    '.price-range',
    '[class*="price-range"]',
  ]);

  const description = extractBySelectors(html, [
    '[class*="description"]',
    '[class*="detail"]',
    '.product-description',
  ]);

  const specs = extractAllBySelectors(html, [
    '[class*="specification"] tr',
    '[class*="attribute"] tr',
    '.product-prop tr',
  ]);

  const images = extractImages(html, [
    '[class*="gallery"] img',
    '[class*="product-image"] img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Emalls parser
function parseEmalls(html: string): Partial<ProductData> {
  const title = extractBySelectors(html, [
    'h1[class*="product"]',
    '.product-title h1',
    '[class*="product-name"]',
    'h1',
  ]);

  const price = extractBySelectors(html, [
    '[class*="price"]',
    '.product-price',
  ]);

  const description = extractBySelectors(html, [
    '[class*="description"]',
    '.product-description',
  ]);

  const specs = extractAllBySelectors(html, [
    '[class*="spec"] tr',
    '[class*="attribute"] tr',
  ]);

  const images = extractImages(html, [
    '[class*="gallery"] img',
    '[class*="product-image"] img',
  ]);

  return { title, price: parsePrice(price), description, specs, images };
}

// Detect site and parse accordingly
function detectAndParse(url: string, html: string): ProductData {
  let partial: Partial<ProductData> = {};

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('digikala')) {
      partial = parseDigikala(html);
    } else if (hostname.includes('basalam')) {
      partial = parseBasalam(html);
    } else if (hostname.includes('torob')) {
      partial = parseTorob(html);
    } else if (hostname.includes('shylaa')) {
      partial = parseShylaa(html);
    } else if (hostname.includes('sheypoor')) {
      partial = parseSheypoor(html);
    } else if (hostname.includes('snapp')) {
      partial = parseSnappShop(html);
    } else if (hostname.includes('amazon')) {
      partial = parseAmazon(html);
    } else if (hostname.includes('ebay')) {
      partial = parseEbay(html);
    } else if (hostname.includes('aliexpress')) {
      partial = parseAliExpress(html);
    } else if (hostname.includes('alibaba')) {
      partial = parseAlibaba(html);
    } else if (hostname.includes('emalls')) {
      partial = parseEmalls(html);
    }
  } catch (_) {
    // URL parse failed
  }

  // Generic scoring fallback for any missing fields
  const generic = genericContentScore(html);

  const title = partial.title || generic.title || extractTitleFromUrl(url);
  const price = partial.price || generic.price || 0;
  const description = partial.description || generic.description || '';
  const specs = partial.specs || [];
  const images = partial.images || [];
  const brand = partial.brand || '';
  const category = partial.category || '';

  // Generate tags from title and description
  const tags = generateTags(title, description, brand, category);

  return {
    title,
    price,
    description,
    specs,
    images,
    tags,
    brand,
    category,
  };
}

// Extract a readable title from URL path
function extractTitleFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || '';
    return last
      .replace(/[-_]/g, ' ')
      .replace(/\.\w+$/, '')
      .replace(/\d+/g, '')
      .trim() || 'محصول';
  } catch (_) {
    return 'محصول';
  }
}

// Generate relevant tags
function generateTags(title: string, description: string, brand: string, category: string): string[] {
  const tags: string[] = [];
  const combined = `${title} ${description} ${brand} ${category}`.toLowerCase();

  // Add brand if available
  if (brand && brand.length > 1) tags.push(brand);

  // Extract meaningful words from title
  const titleWords = title.split(/\s+/).filter(w => w.length > 2);
  titleWords.slice(0, 5).forEach(w => {
    if (!tags.includes(w)) tags.push(w);
  });

  // Common product keywords
  const keywords = ['خرید', 'قیمت', 'اصل', 'اورجینال', 'شیلا', 'shylaa'];
  keywords.forEach(kw => {
    if (!tags.includes(kw)) tags.push(kw);
  });

  return tags.slice(0, 10);
}

// Main export: generate content from URL
export async function generateContentFromUrl(
  url: string,
  actor?: any,
  onProgress?: ProgressCallback
): Promise<GeneratedContent> {
  onProgress?.(0, 'شروع فرآیند', 'در حال آماده‌سازی...');

  let html = '';

  try {
    onProgress?.(1, 'دریافت اطلاعات', 'در حال دریافت صفحه محصول...');
    html = await fetchWithProxies(url, actor, onProgress);
  } catch (e: any) {
    // If fetch fails completely, try to extract from URL itself
    onProgress?.(1, 'دریافت اطلاعات', 'دریافت ناموفق بود، تحلیل از روی لینک...');
    html = '';
  }

  onProgress?.(2, 'تحلیل محتوا', 'در حال استخراج اطلاعات محصول...');

  const productData = html.length > 100
    ? detectAndParse(url, html)
    : {
        title: extractTitleFromUrl(url),
        price: 0,
        description: '',
        specs: [],
        images: [],
        tags: generateTags(extractTitleFromUrl(url), '', '', ''),
        brand: '',
        category: '',
      };

  onProgress?.(3, 'تولید محتوا', 'در حال تولید محتوای بهینه‌سازی شده...');

  // Calculate prices
  const purchasePrice = productData.price;
  const salePrice = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : 0;

  // Build specs string
  const specsString = productData.specs.length > 0
    ? productData.specs.join('\n')
    : '';

  // Short description (max 200 chars)
  const shortDescription = productData.description.length > 200
    ? productData.description.substring(0, 197) + '...'
    : productData.description;

  // SEO title
  const seoTitle = productData.title
    ? `خرید ${productData.title} | شیلا`
    : 'محصول جدید | شیلا';

  return {
    productData,
    title: seoTitle,
    purchasePrice,
    salePrice,
    description: productData.description,
    specs: specsString,
    tags: productData.tags,
    images: productData.images,
    shortDescription,
  };
}
