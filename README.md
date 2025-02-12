# Lens Crawler CLI (wip)

A command-line interface tool that enables data extraction from any webpage using natural language prompts. This tool combines the power of AI with web scraping to make data extraction accessible and intuitive.

## Features

- 🤖 AI-powered schema generation from natural language descriptions
- 🕷️ Advanced web crawling capabilities using Playwright
- 🧹 Configurable data cleaning options
- 📄 Multiple output formats (JSON, CSV, YAML)
- 📱 Support for metadata extraction
- 📚 Pagination handling

The CLI will guide you through the following steps:

1. Enter the target URL
2. Describe the data you want to extract in plain English
3. Select extraction options:
   - Remove HTML tags
   - Trim whitespace
   - Extract metadata
   - Follow pagination
4. Choose output format (JSON/CSV/YAML)

### Example

```bash
$ lens crawl

? Enter the URL to crawl: https://example.com/blog/article
? Enter the fields you want to extract: title of the article, author name, publication date, main content

# The tool will automatically:
# 1. Generate appropriate CSS selectors
# 2. Extract the requested data
# 3. Clean and format the output
```

## Configuration Options

You can configure the following aspects:

- Output format
- Data cleaning options
- Pagination handling
- Metadata extraction

## Built With

- [oclif](https://oclif.io/) - CLI Framework
- [Langchain](https://js.langchain.com/) - AI Integration
- [Ollama](https://ollama.ai/) - Local AI Model
- [Crawlee](https://crawlee.dev/) - Web Scraping
- [Playwright](https://playwright.dev/) - Browser Automation

## License

This project is licensed under the MIT License - see the LICENSE file for details.