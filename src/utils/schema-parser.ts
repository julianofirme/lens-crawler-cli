// src/utils/schema-parser.ts

import { JsonOutputFunctionsParser } from "@langchain/core/output_parsers/openai_functions";
import { PromptTemplate } from "@langchain/core/prompts";
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

  const prompt = PromptTemplate.fromTemplate(`
    Convert the following natural language description of data fields into a structured schema.
    For each field, determine:
    1. A descriptive camelCase field name
    2. The most likely CSS selector to find this data
    3. The type of data (text, attribute, href, src)
    4. If type is attribute, specify which attribute to extract

    Description: {input}

    Output a JSON array where each item has: fieldName, selector, type, and optionally attributeName.
    Example output:
    [
      {
        "fieldName": "articleTitle",
        "selector": "h1.title",
        "type": "text"
      },
      {
        "fieldName": "authorProfileUrl",
        "selector": ".author-link",
        "type": "href"
      }
    ]
  `)

  const parser = new JsonOutputFunctionsParser()
  
  const chain = prompt.pipe(model).pipe(parser)
  
  const result = await chain.invoke({
    input: naturalLanguage,
  })

  return result as SchemaField[]
}