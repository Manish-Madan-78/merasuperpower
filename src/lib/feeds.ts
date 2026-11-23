// Build-time pulls from Richa's social accounts. The site rebuilds every morning
// (see .github/workflows/deploy.yml), so new posts show up within a day.
// Every fetch fails soft: if a source is down or not set up, its section is hidden.

async function get(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
   .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

export interface Video { id: string; title: string; url: string; thumb: string; date: Date; }

/** Latest videos from a YouTube channel's public RSS feed (no API key needed). */
export async function getYouTubeVideos(channelId: string, limit = 3): Promise<Video[]> {
  if (!channelId) return [];
  const res = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`);
  if (!res) return [];
  const xml = await res.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, limit).flatMap(([, e]) => {
    const id = e.match(/<yt:videoId>([^<]+)</)?.[1];
    if (!id) return [];
    const isShort = /\/shorts\//.test(e.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? '');
    return [{
      id,
      title: decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
      url: isShort ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      date: new Date(e.match(/<published>([^<]+)</)?.[1] ?? Date.now()),
    }];
  });
}

export interface InstaPost { url: string; image: string; alt: string; isVideo: boolean; }

/** Latest Instagram posts from a Behold.so JSON feed (handles v1 and v2 feed formats). */
export async function getInstagramPosts(feedUrl: string, limit = 6): Promise<InstaPost[]> {
  if (!feedUrl) return [];
  const res = await get(feedUrl);
  if (!res) return [];
  let data: any;
  try { data = await res.json(); } catch { return []; }
  const posts: any[] = Array.isArray(data) ? data : (data?.posts ?? []);
  return posts.slice(0, limit).flatMap((p) => {
    const isVideo = p.mediaType === 'VIDEO';
    const image = p.sizes?.medium?.mediaUrl ?? p.sizes?.small?.mediaUrl
      ?? (isVideo ? p.thumbnailUrl : p.mediaUrl) ?? p.thumbnailUrl;
    if (!p.permalink || !image) return [];
    const caption = String(p.prunedCaption ?? p.caption ?? '').replace(/\s+/g, ' ').trim();
    return [{ url: p.permalink, image, isVideo, alt: caption ? caption.slice(0, 120) : 'Instagram post' }];
  });
}
