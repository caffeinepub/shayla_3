import React, { useState } from 'react';
import { Copy, Check, Globe, Instagram, MessageSquare, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GeneratedContent } from '../utils/contentGenerator';
import { formatContent, type Platform } from '../utils/platformFormatters';

interface ContentOutputProps {
  content: GeneratedContent;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    // fallback
  }
  // Fallback: textarea approach
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.top = '0';
    textarea.style.left = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (_) {
    return false;
  }
}

interface CopySectionButtonProps {
  text: string;
}

function CopySectionButton({ text }: CopySectionButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-500">کپی شد!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>کپی</span>
        </>
      )}
    </Button>
  );
}

const platformIcons: Record<Platform, React.ReactNode> = {
  website: <Globe className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  ita: <MessageSquare className="w-4 h-4" />,
  blog: <BookOpen className="w-4 h-4" />,
};

const platformLabels: Record<Platform, string> = {
  website: 'وبسایت',
  instagram: 'اینستاگرام',
  ita: 'ایتا',
  blog: 'وبلاگ',
};

const platforms: Platform[] = ['website', 'instagram', 'ita', 'blog'];

export default function ContentOutput({ content }: ContentOutputProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>('website');
  const [copiedAll, setCopiedAll] = useState(false);

  const formatted = formatContent(content, activePlatform);

  const allText = formatted.sections
    .map(s => `=== ${s.title} ===\n${s.content}`)
    .join('\n\n');

  const handleCopyAll = async () => {
    const success = await copyToClipboard(allText);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">محتوای تولید شده</span>
          <Badge variant="secondary" className="text-xs">
            {content.productData.title || 'محصول'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="h-8 text-xs gap-1.5"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">کپی شد!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>کپی همه</span>
            </>
          )}
        </Button>
      </div>

      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
        <div className="px-4 pt-3">
          <TabsList className="w-full grid grid-cols-4">
            {platforms.map(p => (
              <TabsTrigger key={p} value={p} className="gap-1.5 text-xs">
                {platformIcons[p]}
                <span className="hidden sm:inline">{platformLabels[p]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {platforms.map(p => {
          const pFormatted = formatContent(content, p);
          return (
            <TabsContent key={p} value={p} className="mt-0 p-4">
              <ScrollArea className="h-[500px] pr-2">
                <div className="space-y-4">
                  {pFormatted.sections.map((section, idx) => (
                    <div key={idx} className="rounded-lg border border-border/40 bg-background/50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30">
                        <span className="text-xs font-medium text-muted-foreground">{section.title}</span>
                        {section.copyable && <CopySectionButton text={section.content} />}
                      </div>
                      <div className="p-3">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                          {section.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
