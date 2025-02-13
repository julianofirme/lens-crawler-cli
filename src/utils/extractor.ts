/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/extractor.ts

import { ChatOllama } from '@langchain/ollama'
import { Dataset } from 'crawlee'

import { type Config, createCrawler } from './crawler.js'

interface ExtractionOptions {
  extractMetadata: boolean
  followPagination: boolean
  stripHtml: boolean
  trim: boolean
}

interface ExtractorInput {
  naturalLanguageQuery: string
  options: ExtractionOptions
  url: string
}

export async function extractData({
  naturalLanguageQuery,
  options,
  url,
}: ExtractorInput): Promise<Record<string, any>> {
  const model = new ChatOllama({
    baseUrl: 'http://localhost:11434',
    model: 'mistral',
  })

  const pageCounter = { value: 0 }
  const crawlerConfig: Config = {
    maxPages: options.followPagination ? 10 : 1,
    timeout: 30_000,
    waitForSelectors: ['body'],
    waitForXPaths: []
  }

  const crawler = createCrawler(crawlerConfig, pageCounter)
  await crawler.run([url])

  const dataset = await Dataset.open()
  const results = await dataset.getData()

  const processedData = await Promise.all(
    results.items.map(async (item: any) => {
      const systemPrompt = `You are a data extraction expert. Extract ONLY the specific information requested by the user query.
        Format the response as a JSON object where:
        - Keys should be descriptive and in camelCase
        - Values should be the exact information found
        - Only include fields that were explicitly requested
        - If information is not found, set value to null`

        const userPrompt = `URL: ${item.url}
        User Query: ${naturalLanguageQuery}

        Content to analyze:
        ${item.text}

        Extract exactly what was requested and respond with ONLY a JSON object.`

      const response = await model.invoke([
        { content: systemPrompt, role: 'system' },
        { content: userPrompt, role: 'user' }
      ])

      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response')
      }

      const extractedData = JSON.parse(jsonMatch[0])

      if (options.extractMetadata) {
        extractedData.metadata = {
          title: item.title,
          url: item.url
        }
      }

      return extractedData
    })
  )

  return options.followPagination ? processedData : processedData[0]
}