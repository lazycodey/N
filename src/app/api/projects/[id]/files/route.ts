import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await db.file.findMany({
      where: { projectId: params.id },
      orderBy: {
        path: 'asc'
      }
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, content, language, path } = body

    if (!name || !path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const file = await db.file.create({
      data: {
        name,
        content: content || '',
        language: language || 'text',
        path,
        projectId: params.id
      }
    })

    return NextResponse.json(file, { status: 201 })
  } catch (error) {
    console.error('Error creating file:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}