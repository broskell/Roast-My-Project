import axios from 'axios'

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

/**
 * Scrapes DuckDuckGo HTML search page to retrieve matching results without requiring API keys.
 */
export async function performWebSearch(query: string): Promise<SearchResult[]> {
  const cleanQuery = query.trim()
  console.log(`[SEARCH-LAYER] Executing web search for: "${cleanQuery}"`)
  
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: cleanQuery },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000 // 10s timeout
    })

    const html = response.data as string
    const results: SearchResult[] = []
    
    // Parse result blocks from DuckDuckGo HTML structure
    const resultBlockReg = /<div class="result__body">([\s\S]*?)<\/div>/g
    let match
    let count = 0

    while ((match = resultBlockReg.exec(html)) !== null && count < 5) {
      const blockContent = match[1]
      
      const titleMatch = /<a class="result__url"[\s\S]*?>([\s\S]*?)<\/a>/.exec(blockContent)
      const urlMatch = /href="([\s\S]*?)"/.exec(blockContent)
      const snippetMatch = /<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/.exec(blockContent)

      if (titleMatch && urlMatch && snippetMatch) {
        let title = titleMatch[1].replace(/<[^>]*>/g, '').trim()
        let url = urlMatch[1]
        let snippet = snippetMatch[1].replace(/<[^>]*>/g, '').trim()

        // Clean up URL if it goes through DDG redirection
        if (url.includes('uddg=')) {
          const redirectParts = url.split('uddg=')
          if (redirectParts[1]) {
            url = decodeURIComponent(redirectParts[1].split('&')[0])
          }
        }

        // HTML entities unescape helpers
        title = unescapeHtml(title)
        snippet = unescapeHtml(snippet)

        results.push({ title, url, snippet })
        count++
      }
    }

    console.log(`[SEARCH-LAYER] Successfully parsed ${results.length} search results.`)
    return results
  } catch (err) {
    console.error(`[SEARCH-LAYER] Search query failed: "${cleanQuery}". Error:`, err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Executes parallel web queries and compiles them into a structured evidence string block.
 */
export async function compileEvidence(
  title: string,
  description: string,
  industry: string,
  targetAudience: string
): Promise<string> {
  const query1 = `${title} ${industry} competitors`
  const query2 = `${industry} startups targeting ${targetAudience}`
  
  console.log(`[SEARCH-LAYER] Starting parallel evidence gathering for: ${title} (${industry})`)
  
  const [results1, results2] = await Promise.all([
    performWebSearch(query1),
    performWebSearch(query2)
  ])

  const allResults = [...results1, ...results2]
  
  if (allResults.length === 0) {
    return `No search results found. Analyze the idea based on standard industry templates for ${industry}.`
  }

  // Deduplicate results by URL
  const uniqueResultsMap = new Map<string, SearchResult>()
  for (const res of allResults) {
    uniqueResultsMap.set(res.url, res)
  }
  const uniqueResults = Array.from(uniqueResultsMap.values())

  let evidenceText = `## STARTUP ANALYSIS EVIDENCE BASE\n`
  evidenceText += `The following real-world web search results were gathered for this concept:\n\n`

  uniqueResults.forEach((res, index) => {
    evidenceText += `Source [${index + 1}]: ${res.title}\n`
    evidenceText += `URL: ${res.url}\n`
    evidenceText += `Snippet: ${res.snippet}\n\n`
  })

  return evidenceText
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
}
