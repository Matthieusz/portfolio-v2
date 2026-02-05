import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.date(),
      image: image(),
      imageAlt: z.string(),
      tags: z.array(z.string()),
      featured: z.boolean().optional(),
      repoLink: z.string().url().optional(),
      demoLink: z.string().url().optional(),
    }),
});

const posts = defineCollection({
  type: "content",
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.date(),
      tags: z.array(z.string()),
    }),
});

export const collections = { projects, posts };
