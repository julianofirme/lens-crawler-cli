/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-depth */
// src/utils/extractor.ts

import { load } from 'cheerio'
import { Dataset, PlaywrightCrawler } from 'crawlee'

interface ExtractionOptions {
  extractMetadata: boolean
  followPagination: boolean
  stripHtml: boolean
  trim: boolean
}

interface ExtractorInput {
  options: ExtractionOptions
  schema: Array<{
    attributeName?: string
    fieldName: string
    selector: string
    type: 'attribute' | 'href' | 'src' | 'text'
  }>
  url: string
}

export async function extractData({
  options,
  schema,
  url,
}: ExtractorInput): Promise<Record<string, any>> {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: options.followPagination ? 10 : 1,

    async requestHandler({ enqueueLinks, log, page }) {
      const data: Record<string, any> = {}

      const content = await page.content()
      const $ = load(content)

      for (const field of schema) {
        try {
          const element = $(field.selector)

          if (element.length > 0) {
            let value: null | string = null

            switch (field.type) {
              case 'attribute': {
                if (field.attributeName) {
                  value = element.attr(field.attributeName) || null
                }

                break
              }
              
              case 'href': {
                value = element.attr('href') || null
                break
              }
              
              case 'src': {
                value = element.attr('src') || null
                break
              }
              
              case 'text': {
                value = options.stripHtml ? 
                  element.text() : 
                  element.html() || null
                break
              }
            }

            if (value && options.trim) {
              value = value.trim()
            }

            data[field.fieldName] = value
          } else {
            data[field.fieldName] = null
          }
        } catch (error) {
          log.error(`Failed to extract ${field.fieldName}: ${error}`)
          data[field.fieldName] = null
        }
      }

      if (options.extractMetadata) {
        data.metadata = {
          description: $('meta[name="description"]').attr('content'),
          ogDescription: $('meta[property="og:description"]').attr('content'),
          ogImage: $('meta[property="og:image"]').attr('content'),
          ogTitle: $('meta[property="og:title"]').attr('content'),
          title: $('title').text(),
        }
      }

      await Dataset.pushData(data)

      if (options.followPagination) {
        await enqueueLinks({
          globs: [`${new URL(url).origin}/*`],
          label: 'pagination',
        })
      }
    },
  })

  await crawler.run([url])

  const dataset = await Dataset.open()
  const results = await dataset.getData()

  return results.items[0]
}