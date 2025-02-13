// src/utils/crawler.ts

import { load } from 'cheerio'
import { Dataset, PlaywrightCrawler, PlaywrightCrawlingContext } from 'crawlee'
import { Page } from 'playwright'

interface Config {
  maxPages?: number
  timeout?: number
  waitForSelectors?: string[]
  waitForXPaths?: string[]
}

interface PageContent {
  html: string
  text: string
  title: string
  url: string
}

/**
 * Get HTML content from a specific selector on the page
 */
async function getPageHtml(page: Page, selector: string = 'body'): Promise<string> {
  try {
    // Wait for the selector to be present
    await page.waitForSelector(selector, { timeout: 5000 })
    
    // Get the HTML content
    const html = await page.$eval(selector, (element) => {
      // Clone the element to avoid modifying the original
      const clone = element
      
      // Remove unwanted elements
      const removeSelectors = [
        'script',
        'style',
        'noscript',
        'iframe',
        'img',
        '[style*="display: none"]',
        '[hidden]'
      ]
      
      for (const sel of removeSelectors) {
        for (const el of clone.querySelectorAll(sel)) el.remove()
      }
      
      return clone.innerHTML
    })

    return html.trim()
  } catch (error) {
    console.error(`Failed to get HTML from selector ${selector}:`, error)
    return ''
  }
}

/**
 * Wait for an XPath to be present on the page
 */
async function waitForXPath(page: Page, xpath: string, timeout: number): Promise<void> {
  try {
    await page.waitForFunction(xpath, { timeout })
  } catch (error) {
    console.error(`Timeout waiting for XPath ${xpath}:`, error)
    throw error
  }
}

/**
 * Extract clean text content from HTML
 */
function extractTextFromHtml(html: string): string {
  const $ = load(html)
  
  $('script, style, noscript, iframe').remove()
  
  return $.text()
    .replaceAll(/\s+/g, ' ')
    .replaceAll(/\n+/g, '\n')
    .trim()
}

/**
 * Create a configured crawler instance
 */
function createCrawler(config: Config, pageCounter: { value: number }) {
  return new PlaywrightCrawler({    
    async requestHandler({ enqueueLinks, log, page, request }: PlaywrightCrawlingContext) {
      try {
        if (config.waitForSelectors) {
          await Promise.all(
            config.waitForSelectors.map(selector =>
              page.waitForSelector(selector, { timeout: config.timeout })
            )
          )
        }

        if (config.waitForXPaths) {
          await Promise.all(
            config.waitForXPaths.map(xpath =>
              waitForXPath(page, xpath, config.timeout || 30_000)
            )
          )
        }

        const html = await getPageHtml(page)
        const text = extractTextFromHtml(html)
        
        const pageContent: PageContent = {
          html,
          text,
          title: await page.title(),
          url: request.url
        }

        // Store the content
        await Dataset.pushData(pageContent)

        // Follow links if needed
        if (config.maxPages && config.maxPages > 1) {
          await enqueueLinks({
            globs: [`${new URL(request.url).origin}/*`],
            label: 'pagination',
            transformRequestFunction(req) {
              // Increment page counter
              pageCounter.value++
              return req
            }
          })
        }

        log.info(`Successfully processed ${request.url}`)
      } catch (error) {
        log.error(`Failed to process ${request.url}: ${error}`)
        throw error
      }
    },
  })
}

export { type Config, createCrawler, getPageHtml, type PageContent, waitForXPath }