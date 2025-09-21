import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface AIRequest {
  code?: string
  language?: string
  query: string
  context?: Array<{ role: string; content: string }>
  task?: 'generate' | 'improve' | 'debug' | 'explain' | 'refactor' | 'complete'
  files?: Array<{ name: string; content: string; language: string }>
  projectId?: string
}

interface AIResponse {
  content: string
  type: 'code' | 'explanation' | 'suggestion' | 'fix' | 'completion'
  code?: string
  files?: Array<{ name: string; content: string; language: string }>
  confidence?: number
  suggestions?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIRequest
    const { code, language, query, context = [], task = 'explain', files = [], projectId } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Build context from previous messages
    const contextString = context.length > 0 
      ? `Previous conversation:\n${context.map((msg) => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')}\n\n`
      : ''

    // Build project context if files are provided
    const projectContext = files.length > 0 
      ? `Project files:\n${files.map(file => 
          `File: ${file.name} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
        ).join('\n\n')}\n\n`
      : ''

    // Build the prompt based on the task type
    let systemPrompt = ''
    let userPrompt = ''

    switch (task) {
      case 'generate':
        systemPrompt = `You are an expert programmer. Generate complete, working code based on the user's requirements. Provide well-structured, commented, and efficient code.`
        userPrompt = `${contextString}${projectContext}Generate ${language || 'code'} for: ${query}

Provide the complete code implementation. Make sure it's well-structured and includes proper error handling.`
        break

      case 'improve':
        systemPrompt = `You are an expert code reviewer. Improve the given code by making it more efficient, readable, and maintainable. Explain your improvements.`
        userPrompt = `${contextString}${projectContext}Current code (${language}):
\`\`\`${language}
${code}
\`\`\`

Improve this code: ${query}

Provide the improved code in a code block and explain the key improvements made.`
        break

      case 'debug':
        systemPrompt = `You are an expert debugger. Identify and fix bugs in the given code. Explain the issues and provide corrected code.`
        userPrompt = `${contextString}${projectContext}Code with issues (${language}):
\`\`\`${language}
${code}
\`\`\`

Debug this code: ${query}

Identify the bugs, explain the issues, and provide the fixed code.`
        break

      case 'refactor':
        systemPrompt = `You are an expert in code refactoring. Restructure the given code to improve its design, performance, and maintainability while preserving functionality.`
        userPrompt = `${contextString}${projectContext}Code to refactor (${language}):
\`\`\`${language}
${code}
\`\`\`

Refactor this code: ${query}

Provide the refactored code and explain the architectural improvements.`
        break

      case 'complete':
        systemPrompt = `You are an expert programmer. Complete the given code based on the context and requirements. Provide natural and logical completions.`
        userPrompt = `${contextString}${projectContext}Incomplete code (${language}):
\`\`\`${language}
${code}
\`\`\`

Complete this code: ${query}

Provide the completed code with the new parts clearly indicated.`
        break

      default: // explain
        systemPrompt = `You are an expert programming teacher. Explain code concepts clearly and thoroughly. Provide examples and best practices.`
        userPrompt = `${contextString}${projectContext}Code to explain (${language}):
\`\`\`${language}
${code}
\`\`\`

Explain this code: ${query}

Provide a clear explanation of what this code does, how it works, and any important concepts.`
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent code generation
      max_tokens: 2000
    })

    const responseContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to process your request.'

    // Parse the response to extract code and determine type
    let responseType: AIResponse['type'] = 'explanation'
    let extractedCode: string | undefined
    let generatedFiles: Array<{ name: string; content: string; language: string }> | undefined
    let confidence = 0.8
    let suggestions: string[] = []

    // Extract code blocks
    const codeBlocks = responseContent.match(/```(?:\w+)?\n([\s\S]*?)\n```/g)
    if (codeBlocks) {
      extractedCode = codeBlocks[0].replace(/```(?:\w+)?\n([\s\S]*?)\n```/, '$1').trim()
      
      // Determine response type based on task
      switch (task) {
        case 'generate':
          responseType = 'code'
          break
        case 'improve':
          responseType = 'suggestion'
          break
        case 'debug':
          responseType = 'fix'
          break
        case 'complete':
          responseType = 'completion'
          break
      }

      // Extract suggestions if present
      const suggestionMatch = responseContent.match(/(?:suggestions?|recommendations?|tips?):\s*(.*?)(?:\n\n|$)/i)
      if (suggestionMatch) {
        suggestions = suggestionMatch[1].split(/,\s*|\n\s*[-•]\s*/).filter(s => s.trim())
      }
    }

    // If multiple files are mentioned in the response, try to extract them
    if (task === 'generate' && responseContent.includes('File:')) {
      const fileMatches = responseContent.match(/File:\s*(\w+\.\w+)\s*\n\`\`\`\w*\n([\s\S]*?)\n\`\`\`/g)
      if (fileMatches) {
        generatedFiles = fileMatches.map(match => {
          const [, fileName, fileContent] = match.match(/File:\s*(\w+\.\w+)\s*\n\`\`\`\w*\n([\s\S]*?)\n\`\`\`/) || []
          return {
            name: fileName || 'unknown',
            content: fileContent || '',
            language: fileName?.split('.').pop() || 'text'
          }
        }).filter(file => file.name !== 'unknown')
      }
    }

    const response: AIResponse = {
      content: responseContent,
      type: responseType,
      code: extractedCode,
      files: generatedFiles,
      confidence,
      suggestions
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in AI assistance:', error)
    return NextResponse.json(
      { error: 'Failed to get AI assistance' },
      { status: 500 }
    )
  }
}