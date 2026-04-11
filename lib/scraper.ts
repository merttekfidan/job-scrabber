import logger from '@/lib/logger';

const JINA_READER_BASE = 'https://r.jina.ai/';

export const scrapeUrl = async (url: string): Promise<string> => {
  logger.info('Scraping URL via Jina Reader', { url });

  const jinaUrl = `${JINA_READER_BASE}${encodeURIComponent(url)}`;

  const response = await fetch(jinaUrl, {
    headers: {
      Accept: 'text/markdown',
      'X-Return-Format': 'markdown',
    },
  });

  if (!response.ok) {
    logger.warn('Jina Reader failed, trying direct fetch', { status: response.status });
    return directFetch(url);
  }

  const content = await response.text();

  if (!content || content.length < 50) {
    logger.warn('Jina returned insufficient content, trying direct fetch');
    return directFetch(url);
  }

  logger.info('Jina Reader success', { contentLength: content.length });
  return content;
};

const directFetch = async (url: string): Promise<string> => {
  logger.info('Direct fetching URL', { url });

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  const cleaned = bodyContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 50) {
    throw new Error('Failed to extract meaningful content from the page.');
  }

  return cleaned;
};

export const scrapeCompanyWebsite = async (companyUrl: string): Promise<string> => {
  try {
    return await scrapeUrl(companyUrl);
  } catch (e) {
    logger.warn('Company website scrape failed', { error: e instanceof Error ? e.message : String(e) });
    return '';
  }
};
