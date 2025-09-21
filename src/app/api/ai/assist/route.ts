import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, language, query, context = [] } = body

    if (!code || !language || !query) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Build context from previous messages
    const contextString = context.length > 0 
      ? `Previous conversation:\n${context.map((msg: any) => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')}\n\n`
      : ''

    // Build the prompt
    const prompt = `${contextString}You are an expert ${language} programmer and coding assistant. 

Current code (${language}):
\`\`\`${language}
${code}
\`\`\`

User query: ${query}

Provide a helpful response. If the user is asking for code improvements, suggestions, or fixes, provide the modified code in a code block. Be concise but thorough.`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming assistant. You help developers write better code by providing explanations, suggestions, improvements, and debugging help. Always be helpful, accurate, and concise.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const responseContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to process your request.'

    // Determine the type of response and extract code if present
    let responseType: 'code' | 'explanation' | 'suggestion' | 'fix' = 'explanation'
    let extractedCode: string | undefined

    // Check if response contains a code block
    const codeBlockMatch = responseContent.match(/```(?:\w+)?\n([\s\S]*?)\n```/)
    if (codeBlockMatch) {
      extractedCode = codeBlockMatch[1].trim()
      
      // Determine response type based on query
      const lowerQuery = query.toLowerCase()
      if (lowerQuery.includes('improve') || lowerQuery.includes('better')) {
        responseType = 'suggestion'
      } else if (lowerQuery.includes('fix') || lowerQuery.includes('bug') || lowerQuery.includes('error')) {
        responseType = 'fix'
      } else if (lowerQuery.includes('write') || lowerQuery.includes('create') || lowerQuery.includes('implement')) {
        responseType = 'code'
      }
    }

    return NextResponse.json({
      content: responseContent,
      type: responseType,
      code: extractedCode
    })

  } catch (error) {
    console.error('Error in AI assistance:', error)
    return NextResponse.json(
      { error: 'Failed to get AI assistance' },
      { status: 500 }
    )
  }
}