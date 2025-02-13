/* eslint-disable no-new */

import { Command } from '@oclif/core'
import inquirer from 'inquirer'

import { extractData } from '../utils/extractor.js'

export default class Crawl extends Command {
  static override description = 'Extract specific information from any webpage using AI'
  
  async run(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        message: 'Enter the URL to analyze:',
        name: 'url',
        type: 'input',
        validate(input: string) {
          try {
            new URL(input)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }
      },
      {
        message: 'What information would you like to extract? Be specific:',
        name: 'query',
        type: 'input',
        validate(input: string) {
          if (input.trim().length < 10) {
            return 'Please be more specific about what you want to extract'
          }

          return true
        }
      },
      {
        choices: ['JSON'],
        message: 'Select output format:',
        name: 'format',
        type: 'list'
      }
    ])

    this.log('Starting AI-powered extraction...')

    try {
      const data = await extractData({
        naturalLanguageQuery: answers.query,
        options: {
          extractMetadata: true,
          followPagination: false,
          stripHtml: true,
          trim: true
        },
        url: answers.url
      })

      switch (answers.format) {
        case 'JSON': {
          this.log(JSON.stringify(data, null, 2))
          break
        }
      }

      this.log('Extraction completed successfully!')
    } catch (error) {
      this.error('Extraction failed: ' + (error as Error).message)
    }
  }
}