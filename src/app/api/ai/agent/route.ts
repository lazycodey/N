import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'
import { writeFileSync, mkdirSync, existsSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

interface AgentRequest {
  message: string
  projectId?: string
  files?: Array<{ name: string; content: string; language: string }>
  context?: Array<{ role: string; content: string }>
  mode?: 'chat' | 'autonomous'
}

interface AgentAction {
  type: 'create_file' | 'edit_file' | 'delete_file' | 'run_command' | 'create_project' | 'explain'
  target?: string
  content?: string
  command?: string
  reasoning: string
}

interface AgentResponse {
  message: string
  actions: AgentAction[]
  files?: Array<{ name: string; content: string; language: string }>
  output?: string
  status: 'success' | 'error' | 'thinking'
}

interface FileOperation {
  name: string
  content: string
  language: string
  path: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AgentRequest
    const { message, projectId, files = [], context = [], mode = 'autonomous' } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    // Build context from conversation history
    const contextString = context.length > 0 
      ? `Previous conversation:\n${context.map((msg) => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')}\n\n`
      : ''

    // Build project context
    const projectContext = files.length > 0 
      ? `Current project files:\n${files.map(file => 
          `File: ${file.name}\n\`\`\`${file.language}\n${file.content}\n\`\`\``
        ).join('\n\n')}`
      : 'No files in current project.'

    // Create the system prompt for autonomous coding
    const systemPrompt = `You are an autonomous AI coding agent similar to Bolt.new or Z.ai. You can read, create, edit, and delete files, run commands, and build complete applications.

Your capabilities:
1. Create new files with proper content
2. Edit existing files by modifying their content
3. Delete files when necessary
4. Run terminal commands and execute code
5. Build complete projects from scratch
6. Debug and fix issues
7. Explain code and concepts

When responding, you must structure your response as follows:
1. First, explain what you're going to do
2. Then, provide specific actions in this format:
   ACTION: create_file|edit_file|delete_file|run_command|create_project|explain
   TARGET: filename or command
   CONTENT: file content (for create/edit)
   REASONING: why you're taking this action

3. Provide your response message
4. Continue with next actions if needed

Example response format:
I'll create a simple web application with HTML, CSS, and JavaScript files.

ACTION: create_file
TARGET: index.html
CONTENT: <!DOCTYPE html>\n<html>\n<head>\n    <title>My App</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>
REASONING: Creating the main HTML file for the web application

ACTION: create_file
TARGET: styles.css
CONTENT: body { font-family: Arial; margin: 0; padding: 20px; }
REASONING: Adding basic styling for the application

I've created a basic web application with HTML and CSS files. You can now open index.html in your browser to see the result.

Always be specific about file names and paths. Use appropriate file extensions and languages.`

    const userPrompt = `${contextString}${projectContext}

User request: ${message}

${mode === 'autonomous' ? 'Work autonomously to complete this request. Create, edit, or delete files as needed. Run commands if necessary.' : 'Provide guidance and suggestions for this request.'}`

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
      temperature: 0.3,
      max_tokens: 3000
    })

    const responseContent = completion.choices[0]?.message?.content || 'I apologize, but I was unable to process your request.'

    // Parse the response to extract actions
    const actions = parseActions(responseContent)
    
    // Execute the actions
    const results = await executeActions(actions, projectId, files)
    
    // Get updated files after actions
    let updatedFiles = [...files]
    if (results.newFiles) {
      updatedFiles = [...updatedFiles, ...results.newFiles]
    }
    if (results.modifiedFiles) {
      updatedFiles = updatedFiles.map(file => {
        const modified = results.modifiedFiles?.find(mf => mf.name === file.name)
        return modified || file
      })
    }

    const response: AgentResponse = {
      message: responseContent,
      actions,
      files: updatedFiles,
      output: results.output,
      status: results.status
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in AI agent:', error)
    return NextResponse.json(
      { error: 'Failed to process AI agent request' },
      { status: 500 }
    )
  }
}

function parseActions(content: string): AgentAction[] {
  const actions: AgentAction[] = []
  const lines = content.split('\n')
  
  let currentAction: Partial<AgentAction> = {}
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line.startsWith('ACTION:')) {
      // Save previous action if exists
      if (currentAction.type && currentAction.reasoning) {
        actions.push(currentAction as AgentAction)
      }
      
      currentAction = {
        type: line.split(':')[1].trim() as AgentAction['type'],
        reasoning: ''
      }
    } else if (line.startsWith('TARGET:')) {
      currentAction.target = line.split(':')[1].trim()
    } else if (line.startsWith('CONTENT:')) {
      currentAction.content = line.split(':')[1].trim()
      // Handle multi-line content
      let contentLines = [currentAction.content]
      i++
      while (i < lines.length && !lines[i].startsWith('REASONING:')) {
        contentLines.push(lines[i])
        i++
      }
      currentAction.content = contentLines.join('\n')
      i-- // Back up one line since the loop will increment
    } else if (line.startsWith('COMMAND:')) {
      currentAction.command = line.split(':')[1].trim()
    } else if (line.startsWith('REASONING:')) {
      currentAction.reasoning = line.split(':')[1].trim()
    }
  }
  
  // Save last action if exists
  if (currentAction.type && currentAction.reasoning) {
    actions.push(currentAction as AgentAction)
  }
  
  return actions
}

async function executeActions(actions: AgentAction[], projectId?: string, existingFiles: FileOperation[] = []): Promise<{
  status: 'success' | 'error'
  newFiles?: FileOperation[]
  modifiedFiles?: FileOperation[]
  output?: string
}> {
  const results = {
    status: 'success' as const,
    newFiles: [] as FileOperation[],
    modifiedFiles: [] as FileOperation[],
    output: ''
  }
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create_file':
          if (action.target && action.content) {
            const language = action.target.split('.').pop() || 'text'
            const newFile: FileOperation = {
              name: action.target,
              content: action.content,
              language,
              path: `/${action.target}`
            }
            
            // Check if file already exists
            const existingFile = existingFiles.find(f => f.name === action.target)
            if (existingFile) {
              // Update existing file
              existingFile.content = action.content
              results.modifiedFiles.push(existingFile)
            } else {
              // Create new file
              results.newFiles.push(newFile)
            }
            
            // Also save to filesystem if projectId exists
            if (projectId) {
              const tempDir = join(process.cwd(), 'temp', projectId)
              if (!existsSync(tempDir)) {
                mkdirSync(tempDir, { recursive: true })
              }
              const filePath = join(tempDir, action.target)
              writeFileSync(filePath, action.content)
            }
            
            results.output += `Created file: ${action.target}\n`
          }
          break
          
        case 'edit_file':
          if (action.target && action.content) {
            const existingFile = existingFiles.find(f => f.name === action.target)
            if (existingFile) {
              existingFile.content = action.content
              results.modifiedFiles.push(existingFile)
              
              // Update filesystem
              if (projectId) {
                const tempDir = join(process.cwd(), 'temp', projectId)
                const filePath = join(tempDir, action.target)
                writeFileSync(filePath, action.content)
              }
              
              results.output += `Modified file: ${action.target}\n`
            } else {
              results.output += `File not found: ${action.target}\n`
            }
          }
          break
          
        case 'delete_file':
          if (action.target) {
            const fileIndex = existingFiles.findIndex(f => f.name === action.target)
            if (fileIndex !== -1) {
              existingFiles.splice(fileIndex, 1)
              
              // Delete from filesystem
              if (projectId) {
                const tempDir = join(process.cwd(), 'temp', projectId)
                const filePath = join(tempDir, action.target)
                if (existsSync(filePath)) {
                  unlinkSync(filePath)
                }
              }
              
              results.output += `Deleted file: ${action.target}\n`
            } else {
              results.output += `File not found: ${action.target}\n`
            }
          }
          break
          
        case 'run_command':
          if (action.command && projectId) {
            const { exec } = await import('child_process')
            const { promisify } = await import('util')
            const execAsync = promisify(exec)
            
            try {
              const tempDir = join(process.cwd(), 'temp', projectId)
              const { stdout, stderr } = await execAsync(action.command, {
                cwd: tempDir,
                timeout: 10000
              })
              
              results.output += `Command: ${action.command}\n`
              results.output += `Output: ${stdout}\n`
              if (stderr) {
                results.output += `Error: ${stderr}\n`
              }
            } catch (execError: any) {
              results.output += `Command failed: ${action.command}\n`
              results.output += `Error: ${execError.message}\n`
            }
          }
          break
          
        case 'create_project':
          // This would create a new project in the database
          results.output += `Project creation would be implemented here\n`
          break
          
        case 'explain':
          // This is just an explanation, no action needed
          break
      }
    } catch (error) {
      results.status = 'error'
      results.output += `Error executing action ${action.type}: ${error}\n`
    }
  }
  
  return results
}