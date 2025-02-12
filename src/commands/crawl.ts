import { Command } from '@oclif/core'
import inquirer from 'inquirer'

import { extractData } from '../utils/extractor.js'
import { parseSchema } from '../utils/schema-parser.js'

export default class Crawl extends Command {
  static override description = 'Extract data from a webpage using natural language schema'
  static override examples = [
    '<%= config.bin %> crawl',
  ]

  async run(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        message: 'Enter the URL to crawl:',
        name: 'url',
        type: 'input',
        validate(input: string) {
          try {
            // eslint-disable-next-line no-new
            new URL(input)
            return true
          } catch {
            return 'Please enter a valid URL'
          }
        }
      },
      {
        message: 'Enter the fields you want to extract (comma separated)\nExample: title, author name, publication date, main content:',
        name: 'schema',
        type: 'input',
        validate(input: string) {
          if (input.trim().length === 0) {
            return 'Please enter at least one field'
          }

          return true
        }
      }
    ])

    const extractionOptions = await inquirer.prompt([
      {
        choices: [
          { checked: true, name: 'Remove HTML tags from text', value: 'stripHtml' },
          { checked: true, name: 'Trim whitespace', value: 'trim' },
          { name: 'Extract metadata', value: 'metadata' },
          { name: 'Follow pagination', value: 'pagination' }
        ],
        message: 'Select extraction options:',
        name: 'options',
        type: 'checkbox'
      },
      {
        choices: ['JSON', 'CSV', 'YAML'],
        message: 'Select output format:',
        name: 'format',
        type: 'list'
      }
    ])

    this.log('Starting extraction...')

    try {
      const schema = await parseSchema(answers.schema)

      const data = await extractData({
        options: {
          extractMetadata: extractionOptions.options.includes('metadata'),
          followPagination: extractionOptions.options.includes('pagination'),
          stripHtml: extractionOptions.options.includes('stripHtml'),
          trim: extractionOptions.options.includes('trim')
        },
        schema,
        url: answers.url
      })

      switch (extractionOptions.format) {
        case 'CSV': {
          break
        }

        case 'JSON': {
          this.log(JSON.stringify(data, null, 2))
          break
        }

        case 'YAML': {
          break
        }
      }

      this.log('Extraction completed successfully!')

    } catch (error) {
      this.error('Extraction failed: ' + (error as Error).message)
    }
  }
}