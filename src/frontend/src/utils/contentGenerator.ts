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

// Helper: try to extract raw text from a fetch response (handles JSON wrappers from proxies)
async function extractTextFromResponse(response: Response): Promise<string> {
  // Try JSON first (allorigins format)
  try {
    const clone = response.clone();
    const data = await clone.json();
    if (data && data.contents && data.contents.length > 200) {
      return data.contents;
    }
    // Some proxies wrap differently
    if (data && data.body && data.body.length > 200) return data.body;
    if (data && data.data && data.data.length > 200) return data.data;
  } catch (_) { /* not JSON */ }
  // Fallback: plain text
  const text = await response.text().catch(() => '');
  return text;
}

// Fetch URL with multiple CORS proxy fallbacks
async function fetchWithProxies(
  url: string,
  actor: any,
  onProgress?: ProgressCallback
): Promise<string> {
  // First try backend actor (ICP canister can make HTTP calls without CORS issues)
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

  // For Eitaa: also try their embed/preview endpoint which returns more data
  const isEitaa = url.includes('eitaa.com');
  if (isEitaa) {
    // Try Eitaa's own embed endpoint
    try {
      const embedUrl = `https://eitaa.com/embed${new URL(url).pathname}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(embedUrl)}`;
      onProgress?.(1, 'دریافت اطلاعات', 'تلاش با endpoint ایتا...');
      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (response.ok) {
        const text = await extractTextFromResponse(response);
        if (text && text.length > 200) return text;
      }
    } catch (_) { /* skip */ }
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
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        onProgress?.(1, 'دریافت اطلاعات', `پروکسی ${i + 1} ناموفق بود (${response.status})، تلاش بعدی...`);
        continue;
      }

      const text = await extractTextFromResponse(response);
      if (text && text.length > 300) {
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

// Helper: extract Open Graph and JSON-LD structured data
function extractOGData(html: string): Partial<ProductData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';

  let jsonLdTitle = '';
  let jsonLdDesc = '';
  let jsonLdImage = '';
  let jsonLdPrice = 0;

  // Parse JSON-LD structured data
  const jsonLdScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const types = ['Product', 'Article', 'WebPage', 'ItemPage'];
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (types.some(t => (item['@type'] || '').includes(t))) {
          jsonLdTitle = item.name || item.headline || '';
          jsonLdDesc = item.description || '';
          if (item.image) {
            jsonLdImage = typeof item.image === 'string' ? item.image
              : Array.isArray(item.image) ? item.image[0]
              : item.image?.url || '';
          }
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            jsonLdPrice = parsePrice(String(offer?.price || '0'));
          }
          if (jsonLdTitle) break;
        }
      }
    } catch (_) {
      // skip malformed JSON-LD
    }
  }

  const title = ogTitle || jsonLdTitle;
  const description = ogDesc || jsonLdDesc;
  const images = ogImage ? [ogImage] : (jsonLdImage ? [jsonLdImage] : []);
  const price = jsonLdPrice;

  return { title, description, images, price };
}

// Extract product info from raw post text (for messaging apps like Eitaa/Telegram)
function extractProductFromPostText(text: string): { title: string; price: number; description: string; specs: string[] } {
  if (!text) return { title: '', price: 0, description: '', specs: [] };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract price from text
  let price = 0;
  const pricePatterns = [
    /قیمت[:\s]*([۰-۹\d][۰-۹\d,،٬\s]*)\s*(تومان|ریال|هزار\s*تومان)/i,
    /([۰-۹\d][۰-۹\d,،٬]+)\s*(تومان|ریال)/i,
    /price[:\s]*([\d,]+)/i,
  ];
  for (const pat of pricePatterns) {
    const m = text.match(pat);
    if (m) {
      price = parsePrice(m[1]);
      // If "هزار تومان" multiply by 1000
      if (m[2]?.includes('هزار')) price *= 1000;
      if (price > 0) break;
    }
  }

  // Find title: first meaningful non-emoji, non-price line
  let title = '';
  for (const line of lines) {
    const clean = line.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[#@]+/g, '').trim();
    if (clean.length > 5 && clean.length < 150 && !clean.match(/\d+\s*(تومان|ریال)/)) {
      title = clean;
      break;
    }
  }

  // Extract specs: lines that look like key:value
  const specs: string[] = [];
  for (const line of lines) {
    if (line.includes(':') || line.includes('\u2022') || line.includes('\u2705') || line.includes('\u25AA')) {
      const clean = line.replace(/[\u2705\u25AA\u2022]/g, '').trim();
      if (clean.length > 5 && clean.length < 200) {
        specs.push(clean);
      }
    }
  }

  // Full text as description
  const description = text.length > 20 ? text : '';

  return { title, price, description, specs };
}

// Eitaa parser — extracts post body text not just channel name
function parseEitaa(html: string): Partial<ProductData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try OG tags
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';

  // --- Strategy 1: Try to find the actual post text in <script> tags (JSON data)
  let postBody = '';
  const scripts = Array.from(doc.querySelectorAll('script'));
  for (const script of scripts) {
    const src = script.textContent || '';
    // Look for message content patterns in JS bundles
    const msgPatterns = [
      /"text"\s*:\s*"([^"]{20,}?)"/,
      /"message"\s*:\s*"([^"]{20,}?)"/,
      /"caption"\s*:\s*"([^"]{20,}?)"/,
      /'text'\s*:\s*'([^']{20,}?)'/,
    ];
    for (const pat of msgPatterns) {
      const m = src.match(pat);
      if (m && m[1]) {
        const decoded = m[1].replace(/\\n/g, '\n').replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
        if (decoded.length > 20) {
          postBody = decoded;
          break;
        }
      }
    }
    if (postBody) break;
  }

  // --- Strategy 2: Try DOM selectors for post body
  if (!postBody) {
    const postBodySelectors = [
      '.message-text',
      '[class*="message-text"]',
      '[class*="post-text"]',
      '[class*="msg-text"]',
      '.post-content',
      '[class*="post-content"]',
      '[class*="post-body"]',
      '.channel-post-content',
      '.tgme_widget_message_text',
      // Eitaa specific
      '[class*="eitaa"]',
      '[class*="channel"]',
      'main article',
      'main p',
    ];

    for (const sel of postBodySelectors) {
      try {
        const el = doc.querySelector(sel);
        if (el) {
          const text = el.textContent?.trim() || '';
          if (text.length > 20) {
            postBody = text;
            break;
          }
        }
      } catch (_) { /* skip */ }
    }
  }

  // --- Strategy 3: Extract from OG description if it has real product data
  if (!postBody && ogDesc && ogDesc.length > 20) {
    // OG desc for Eitaa posts sometimes has partial post text
    postBody = ogDesc;
  }

  // --- Strategy 4: Extract from all paragraph text, scored by relevance
  if (!postBody) {
    const allText = Array.from(doc.querySelectorAll('p, div, span'))
      .map(el => el.textContent?.trim() || '')
      .filter(t => t.length > 30)
      .sort((a, b) => {
        // Score by product-related keywords
        const keywords = ['تومان', 'قیمت', 'پارچه', 'جنس', 'رنگ', 'سایز', 'متر', 'کیلو', 'خرید'];
        const scoreA = keywords.filter(k => a.includes(k)).length;
        const scoreB = keywords.filter(k => b.includes(k)).length;
        return scoreB - scoreA;
      });
    if (allText.length > 0 && allText[0].length > 20) {
      postBody = allText[0];
    }
  }

  // Extract product info from post body
  const extracted = extractProductFromPostText(postBody);

  // Title logic: if OG title is just the channel name (short, no product info), prefer extracted title
  let title = '';
  if (extracted.title && extracted.title.length > 5) {
    title = extracted.title;
  } else if (ogTitle && ogTitle.length > 3) {
    title = ogTitle;
  }

  // Collect images: OG image + any images found in post
  const images: string[] = [];
  if (ogImage) images.push(ogImage);
  // Also scan for any image URLs in the HTML
  const imgEls = doc.querySelectorAll('img[src*="http"]');
  imgEls.forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src && !images.includes(src) && !src.includes('avatar') && !src.includes('icon')) {
      images.push(src);
    }
  });

  return {
    title,
    description: extracted.description || postBody || ogDesc,
    price: extracted.price,
    specs: extracted.specs,
    images: images.slice(0, 8),
  };
}

// Telegram parser
function parseTelegram(html: string): Partial<ProductData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';

  // Try post body selectors
  let postBody = '';
  const msgSelectors = ['.tgme_widget_message_text', '.message', '[class*="message-text"]'];
  for (const sel of msgSelectors) {
    try {
      const el = doc.querySelector(sel);
      if (el) {
        const text = el.textContent?.trim() || '';
        if (text.length > 10) { postBody = text; break; }
      }
    } catch (_) { /* skip */ }
  }

  return {
    title: ogTitle,
    description: postBody || ogDesc,
    images: ogImage ? [ogImage] : [],
  };
}

// Instagram parser
function parseInstagram(html: string): Partial<ProductData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';

  return {
    title: ogTitle,
    description: ogDesc,
    images: ogImage ? [ogImage] : [],
  };
}

// Generic content scoring algorithm
function genericContentScore(html: string): { description: string; title: string; price: number } {
  // First try OG/JSON-LD data — it's the most reliable signal
  const ogData = extractOGData(html);
  if (ogData.title && ogData.title.length > 3 && ogData.description && ogData.description.length > 20) {
    return {
      title: ogData.title,
      description: ogData.description,
      price: ogData.price || 0,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove noise elements
  ['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript'].forEach(tag => {
    Array.from(doc.querySelectorAll(tag)).forEach(el => { el.remove(); });
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
    } else if (hostname.includes('eitaa.com') || hostname.includes('eitaa')) {
      partial = parseEitaa(html);
    } else if (hostname.includes('t.me') || hostname.includes('telegram')) {
      partial = parseTelegram(html);
    } else if (hostname.includes('instagram')) {
      partial = parseInstagram(html);
    } else {
      // For unknown platforms, try OG data as primary source
      partial = extractOGData(html);
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

  // Add brand if available
  if (brand && brand.length > 1 && !tags.includes(brand)) tags.push(brand);

  // Extract meaningful words from title
  const titleWords = title.split(/\s+/).filter(w => w.length > 2 && !w.match(/^\d+$/));
  titleWords.slice(0, 6).forEach(w => {
    if (!tags.includes(w)) tags.push(w);
  });

  // Extract meaningful words from description if title is sparse
  if (tags.length < 4 && description) {
    const descWords = description.split(/\s+/).filter(w => w.length > 3 && !w.match(/^\d+$/) && !w.includes('http'));
    descWords.slice(0, 4).forEach(w => {
      if (!tags.includes(w)) tags.push(w);
    });
  }

  // Category-based keywords
  if (category) {
    const catWords = category.split(/\s+/).filter(w => w.length > 2);
    catWords.slice(0, 2).forEach(w => {
      if (!tags.includes(w)) tags.push(w);
    });
  }

  // Common product keywords
  const keywords = ['خرید', 'شیلا', 'shylaa', 'فروشگاه_شیلا'];
  keywords.forEach(kw => {
    if (!tags.includes(kw)) tags.push(kw);
  });

  return tags.slice(0, 12);
}

// Build a rich SEO description from product data
function buildSEODescription(productData: ProductData): string {
  const { title, description, specs, brand, category } = productData;

  if (description && description.length > 50) {
    // Clean up the description — remove URLs and excessive whitespace
    return description
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s{3,}/g, '\n\n')
      .trim();
  }

  // Build from specs if description is empty
  if (specs && specs.length > 0) {
    const parts: string[] = [];
    if (title) parts.push(`${title} یکی از محصولات باکیفیت موجود در فروشگاه شیلا است.`);
    parts.push('\nمشخصات:\n' + specs.slice(0, 5).join('\n'));
    return parts.join('\n');
  }

  // Minimal fallback
  if (title && title.length > 5) {
    return `${title} با کیفیت عالی و قیمت مناسب در فروشگاه شیلا موجود است. برای خرید با ضمانت اصالت و ارسال سریع به سراسر ایران به shylaa.ir مراجعه کنید.`;
  }

  return 'محصول با کیفیت عالی در فروشگاه شیلا موجود است.';
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

  // Build SEO-optimized description
  const seoDescription = buildSEODescription(productData);

  // Short description (max 200 chars)
  const shortDescription = seoDescription.length > 200
    ? seoDescription.substring(0, 197) + '...'
    : seoDescription;

  // SEO title — use actual product title, not generic
  const productName = productData.title && productData.title.length > 3 ? productData.title : null;
  const seoTitle = productName
    ? `خرید ${productName} | فروشگاه شیلا`
    : 'محصول جدید | فروشگاه شیلا';

  return {
    productData,
    title: seoTitle,
    purchasePrice,
    salePrice,
    description: seoDescription,
    specs: specsString,
    tags: productData.tags,
    images: productData.images,
    shortDescription,
  };
}
