import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../data/site.json';

// Feed of blog posts. Newsletter tools (Buttondown) and social schedulers read this
// to email or share each new post automatically.
export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return rss({
    title: `${site.name} · ${site.author}`,
    description: site.intro,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.date,
      description: p.data.summary ?? '',
      link: `/blog/${p.id}/`,
      categories: [p.data.category],
      author: `${site.email} (${site.author})`,
    })),
    customData: '<language>en-in</language>',
  });
}
