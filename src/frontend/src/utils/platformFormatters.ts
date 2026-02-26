import type { GeneratedContent } from './contentGenerator';

export type Platform = 'website' | 'instagram' | 'ita' | 'blog';

export interface FormattedContent {
  platform: Platform;
  sections: ContentSection[];
}

export interface ContentSection {
  title: string;
  content: string;
  copyable?: boolean;
}

function formatPrice(price: number): string {
  if (price <= 0) return 'تماس بگیرید';
  return price.toLocaleString('fa-IR') + ' تومان';
}

function formatPriceNum(price: number): string {
  if (price <= 0) return '—';
  return price.toLocaleString('fa-IR');
}

export function formatForWebsite(content: GeneratedContent): FormattedContent {
  const { productData, title, purchasePrice, salePrice, description, specs, tags, images, shortDescription } = content;
  const productName = productData.title || 'محصول';
  const salePriceCalc = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : salePrice;

  const metaDescription = shortDescription || description.substring(0, 160);

  const specsHtml = specs
    ? specs.split('\n').filter(Boolean).map(s => `<li>${s}</li>`).join('\n')
    : '<li>مشخصات در حال بارگذاری...</li>';

  const tagsHtml = tags.map(t => `<span class="tag">${t}</span>`).join(' ');

  const imagesHtml = images.length > 0
    ? images.slice(0, 5).map((img, i) => `<img src="${img}" alt="${productName} - تصویر ${i + 1}" loading="lazy" />`).join('\n')
    : '<!-- تصاویر محصول را اینجا اضافه کنید -->';

  return {
    platform: 'website',
    sections: [
      {
        title: 'عنوان SEO',
        content: title,
        copyable: true,
      },
      {
        title: 'متا دیسکریپشن',
        content: metaDescription,
        copyable: true,
      },
      {
        title: 'توضیح کوتاه محصول',
        content: shortDescription || description.substring(0, 200),
        copyable: true,
      },
      {
        title: 'توضیح کامل محصول',
        content: description || `${productName} با کیفیت عالی در فروشگاه شیلا موجود است.`,
        copyable: true,
      },
      {
        title: 'مشخصات فنی (HTML)',
        content: `<ul class="product-specs">\n${specsHtml}\n</ul>`,
        copyable: true,
      },
      {
        title: 'قیمت خرید',
        content: formatPrice(purchasePrice),
        copyable: true,
      },
      {
        title: 'قیمت فروش (۴۰٪ سود)',
        content: formatPrice(salePriceCalc),
        copyable: true,
      },
      {
        title: 'تگ‌های محصول',
        content: tags.join(', '),
        copyable: true,
      },
      {
        title: 'تصاویر محصول (HTML)',
        content: imagesHtml,
        copyable: true,
      },
      {
        title: 'HTML کامل صفحه محصول',
        content: `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${metaDescription}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  ${images[0] ? `<meta property="og:image" content="${images[0]}">` : ''}
</head>
<body>
  <article class="product-page">
    <h1>${productName}</h1>
    <div class="product-images">
      ${imagesHtml}
    </div>
    <div class="product-price">
      <span class="sale-price">${formatPrice(salePriceCalc)}</span>
      ${purchasePrice > 0 ? `<span class="purchase-price">${formatPrice(purchasePrice)}</span>` : ''}
    </div>
    <div class="product-short-desc">
      <p>${shortDescription || description.substring(0, 200)}</p>
    </div>
    <div class="product-description">
      <h2>توضیحات محصول</h2>
      <p>${description || `${productName} با کیفیت عالی در فروشگاه شیلا موجود است.`}</p>
    </div>
    <div class="product-specs">
      <h2>مشخصات فنی</h2>
      <ul>
        ${specsHtml}
      </ul>
    </div>
    <div class="product-tags">
      ${tagsHtml}
    </div>
  </article>
</body>
</html>`,
        copyable: true,
      },
    ],
  };
}

export function formatForInstagram(content: GeneratedContent): FormattedContent {
  const { productData, purchasePrice, salePrice, description, tags, images, shortDescription } = content;
  const productName = productData.title || 'محصول';
  const salePriceCalc = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : salePrice;

  const hashtags = [
    ...tags.map(t => `#${t.replace(/\s+/g, '_')}`),
    '#شیلا',
    '#خرید_آنلاین',
    '#فروشگاه_شیلا',
    '#shylaa',
    '#خرید_اینترنتی',
  ].slice(0, 20).join(' ');

  const caption = `✨ ${productName}

${shortDescription || description.substring(0, 200)}

💰 قیمت: ${formatPrice(salePriceCalc)}
${purchasePrice > 0 ? `🏷️ قیمت خرید: ${formatPrice(purchasePrice)}` : ''}

🛒 برای خرید به لینک بیو مراجعه کنید
🌐 shylaa.ir

${hashtags}`;

  const storyText = `🛍️ ${productName}
قیمت: ${formatPrice(salePriceCalc)}
👆 لینک در بیو`;

  return {
    platform: 'instagram',
    sections: [
      {
        title: 'کپشن پست اینستاگرام',
        content: caption,
        copyable: true,
      },
      {
        title: 'متن استوری',
        content: storyText,
        copyable: true,
      },
      {
        title: 'هشتگ‌ها',
        content: hashtags,
        copyable: true,
      },
      {
        title: 'لینک تصویر اول',
        content: images[0] || 'تصویر موجود نیست',
        copyable: true,
      },
    ],
  };
}

export function formatForIta(content: GeneratedContent): FormattedContent {
  const { productData, purchasePrice, salePrice, description, tags, images, shortDescription } = content;
  const productName = productData.title || 'محصول';
  const salePriceCalc = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : salePrice;

  const post = `📦 ${productName}

${shortDescription || description.substring(0, 300)}

💵 قیمت: ${formatPrice(salePriceCalc)}

🔗 خرید از: shylaa.ir`;

  const channelPost = `🛍️ محصول جدید در شیلا

${productName}

${description.substring(0, 500) || shortDescription}

💰 قیمت فروش: ${formatPrice(salePriceCalc)}
${purchasePrice > 0 ? `📊 قیمت خرید: ${formatPrice(purchasePrice)}` : ''}

🌐 shylaa.ir
${tags.map(t => `#${t.replace(/\s+/g, '_')}`).slice(0, 10).join(' ')}`;

  return {
    platform: 'ita',
    sections: [
      {
        title: 'پست ایتا',
        content: post,
        copyable: true,
      },
      {
        title: 'پست کانال',
        content: channelPost,
        copyable: true,
      },
      {
        title: 'لینک تصویر',
        content: images[0] || 'تصویر موجود نیست',
        copyable: true,
      },
    ],
  };
}

export function formatForBlog(content: GeneratedContent): FormattedContent {
  const { productData, purchasePrice, salePrice, description, specs, tags, images, shortDescription, title } = content;
  const productName = productData.title || 'محصول';
  const salePriceCalc = purchasePrice > 0 ? Math.round(purchasePrice * 1.4) : salePrice;

  const specsMarkdown = specs
    ? specs.split('\n').filter(Boolean).map(s => `- ${s}`).join('\n')
    : '- مشخصات در حال بارگذاری...';

  const imagesMarkdown = images.slice(0, 3).map((img, i) =>
    `![${productName} - تصویر ${i + 1}](${img})`
  ).join('\n');

  const blogPost = `# ${title}

## معرفی ${productName}

${description || `${productName} یکی از محصولات باکیفیت موجود در فروشگاه شیلا است.`}

${imagesMarkdown}

## مشخصات فنی ${productName}

${specsMarkdown}

## قیمت و خرید

| مشخصه | مقدار |
|--------|-------|
| قیمت فروش | ${formatPrice(salePriceCalc)} |
${purchasePrice > 0 ? `| قیمت خرید | ${formatPrice(purchasePrice)} |` : ''}
| وضعیت | موجود |

## چرا ${productName} را از شیلا بخریم؟

- ✅ ضمانت اصالت کالا
- ✅ ارسال سریع به سراسر ایران
- ✅ پشتیبانی ۲۴ ساعته
- ✅ بهترین قیمت بازار
- ✅ امکان مرجوعی

## سوالات متداول

**آیا ${productName} اصل است؟**
بله، تمام محصولات فروشگاه شیلا دارای ضمانت اصالت هستند.

**مدت زمان ارسال چقدر است؟**
سفارشات در کمتر از ۴۸ ساعت ارسال می‌شوند.

**آیا امکان مرجوعی وجود دارد؟**
بله، تا ۷ روز پس از دریافت امکان مرجوعی وجود دارد.

---
*منبع: [فروشگاه شیلا](https://shylaa.ir)*

${tags.map(t => `#${t.replace(/\s+/g, '_')}`).join(' ')}`;

  return {
    platform: 'blog',
    sections: [
      {
        title: 'مقاله وبلاگ (Markdown)',
        content: blogPost,
        copyable: true,
      },
      {
        title: 'خلاصه مقاله',
        content: shortDescription || description.substring(0, 300),
        copyable: true,
      },
      {
        title: 'تگ‌های مقاله',
        content: tags.join(', '),
        copyable: true,
      },
    ],
  };
}

export function formatContent(content: GeneratedContent, platform: Platform): FormattedContent {
  switch (platform) {
    case 'website':
      return formatForWebsite(content);
    case 'instagram':
      return formatForInstagram(content);
    case 'ita':
      return formatForIta(content);
    case 'blog':
      return formatForBlog(content);
    default:
      return formatForWebsite(content);
  }
}
