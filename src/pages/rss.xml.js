import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = await getCollection('blog', ({ id, data }) =>
    id.startsWith('id/') && !data.draft
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.publishedAt,
        link: `/blog/${post.slug.replace('id/', '')}/`,
        categories: [post.data.category, ...post.data.tags],
      })),
    customData: `<language>id</language>`,
  });
}
