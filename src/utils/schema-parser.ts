// src/utils/schema-parser.ts

import { ChatOllama } from '@langchain/ollama'

interface SchemaField {
  attributeName?: string
  fieldName: string
  selector: string
  type: 'attribute' | 'href' | 'src' | 'text'
}

export async function parseSchema(naturalLanguage: string): Promise<SchemaField[]> {
  const model = new ChatOllama({
    baseUrl: 'http://localhost:11434',
    model: 'mistral',
  })

  const systemPrompt = `You are a web scraping expert. Your task is to convert natural language descriptions into web scraping schemas.
Always respond with a valid JSON array containing objects with these fields:
- fieldName: camelCase identifier
- selector: CSS selector
- type: one of 'text', 'href', 'src', or 'attribute'
- attributeName: (optional) only if type is 'attribute'`

  const userPrompt = `Convert this description into a scraping schema: ${naturalLanguage}
Output format must be a JSON array like this example:
[
  {
    "fieldName": "articleTitle",
    "selector": "h1.title",
    "type": "text"
  }
]`

  try {
    const response = await model.invoke([
      { content: systemPrompt, role: 'system' },
      { content: userPrompt, role: 'user' }
    ])

    const match = response.content.toString().match(/\[[\s\S]*\]/)
    if (!match) {
      throw new Error('No valid JSON array found in response')
    }

    const schema = JSON.parse(match[0])

    if (!Array.isArray(schema)) {
      throw new TypeError('Schema must be an array')
    }

    for (const [index, field] of schema.entries()) {
      if (!field.fieldName || !field.selector || !field.type) {
        throw new Error(`Invalid field at index ${index}`)
      }

      if (!['attribute', 'href', 'src', 'text'].includes(field.type)) {
        throw new Error(`Invalid type "${field.type}" at index ${index}`)
      }
    }

    return schema
  } catch (error) {
    console.error('Schema parsing error:', error)
    throw new Error(`Failed to parse schema: ${(error as Error).message}`)
  }
}