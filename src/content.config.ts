import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['For parents', 'For teachers', 'Learning differences', 'Classroom stories']),
    summary: z.string().optional(),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    quote: z.string(),
    order: z.number().default(0),
    show: z.boolean().default(true),
  }),
});

export const collections = { posts, testimonials };
