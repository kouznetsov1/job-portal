import Firecrawl from "@mendable/firecrawl-js";
import { Config, Data, Effect, } from "effect";

export class WebCrawlerError extends Data.TaggedError("WebCrawlerError")<{
  message: string;
  cause?: unknown;
}> {}

interface ScrapedData {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
}

export class WebCrawler extends Effect.Service<WebCrawler>()("WebCrawler", {
  effect: Effect.gen(function* () {
    const apiKey = yield* Config.string("FIRECRAWL_API_KEY");
    const firecrawl = new Firecrawl({ apiKey });

    const scrapeWebsite = (url: string) =>
      Effect.fn("webCrawler.scrapeWebsite")(function* () {
        const websiteUrl = url.startsWith("http") ? url : `https://${url}`;

        const result = yield* Effect.tryPromise({
          try: () =>
            firecrawl.scrape(websiteUrl, {
              formats: ["markdown", "html"],
            }),
          catch: (error) =>
            new WebCrawlerError({
              message: "Failed to scrape website",
              cause: error,
            }),
        });

        const extractSocialLinks = (html: string | undefined) => {
          if (!html) return {};

          const links: { linkedin?: string; facebook?: string; twitter?: string } = {};

          const linkedinMatch = html.match(/https?:\/\/[^"'\s]*linkedin\.com[^"'\s]*/i);
          const facebookMatch = html.match(/https?:\/\/[^"'\s]*facebook\.com[^"'\s]*/i);
          const twitterMatch = html.match(/https?:\/\/[^"'\s]*(twitter\.com|x\.com)[^"'\s]*/i);

          if (linkedinMatch) links.linkedin = linkedinMatch[0];
          if (facebookMatch) links.facebook = facebookMatch[0];
          if (twitterMatch) links.twitter = twitterMatch[0];

          return links;
        };

        const socialLinks = extractSocialLinks(result.html);

        const scrapedData: ScrapedData = {
          markdown: result.markdown,
          html: result.html,
          metadata: result.metadata,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        };

        return scrapedData;
      })();

    return {
      scrapeWebsite,
    };
  }),
}) {}
