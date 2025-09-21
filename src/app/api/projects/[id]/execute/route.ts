import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'

const execAsync = promisify(exec)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { command, files } = body

    if (!command || !files) {
      return NextResponse.json(
        { error: 'Missing command or files' },
        { status: 400 }
      )
    }

    // Create temporary directory for execution
    const tempDir = join(process.cwd(), 'temp', params.id)
    
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true })
    }

    // Write files to temporary directory
    files.forEach((file: any) => {
      const filePath = join(tempDir, file.name)
      writeFileSync(filePath, file.content)
    })

    // Execute the command
    const startTime = Date.now()
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: tempDir,
        timeout: 10000, // 10 second timeout
        killSignal: 'SIGTERM'
      })
      
      const duration = Date.now() - startTime
      
      // Save execution record
      // Check if user exists, if not create a default user
      let user = await db.user.findUnique({
        where: { id: 'temp-user-id' }
      })

      if (!user) {
        user = await db.user.create({
          data: {
            id: 'temp-user-id',
            email: 'temp-user-id@temp.com',
            name: 'Temp User'
          }
        })
      }

      await db.execution.create({
        data: {
          command,
          output: stdout,
          error: stderr || null,
          exitCode: 0,
          status: 'completed',
          duration,
          userId: user.id,
          projectId: params.id
        }
      })

      return NextResponse.json({
        output: stdout,
        error: stderr,
        exitCode: 0,
        duration
      })
    } catch (execError: any) {
      const duration = Date.now() - startTime
      
      // Save failed execution record
      // Check if user exists, if not create a default user
      let user = await db.user.findUnique({
        where: { id: 'temp-user-id' }
      })

      if (!user) {
        user = await db.user.create({
          data: {
            id: 'temp-user-id',
            email: 'temp-user-id@temp.com',
            name: 'Temp User'
          }
        })
      }

      await db.execution.create({
        data: {
          command,
          output: null,
          error: execError.message,
          exitCode: execError.code || 1,
          status: 'failed',
          duration,
          userId: user.id,
          projectId: params.id
        }
      })

      return NextResponse.json({
        output: '',
        error: execError.message,
        exitCode: execError.code || 1,
        duration
      })
    }
  } catch (error) {
    console.error('Error executing code:', error)
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    )
  }
}