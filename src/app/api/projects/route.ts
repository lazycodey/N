import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        files: true,
        _count: {
          select: {
            executions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, language, ownerId, files = [] } = body

    if (!name || !language || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        language,
        ownerId,
        files: {
          create: files.map((file: any) => ({
            name: file.name,
            content: file.content || '',
            language: file.language || 'text',
            path: file.path || `/${file.name}`
          }))
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        files: true
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}