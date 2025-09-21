import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const file = await db.file.findFirst({
      where: { 
        id: params.fileId,
        projectId: params.id
      }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const body = await request.json()
    const { content, name, language, path } = body

    const file = await db.file.updateMany({
      where: { 
        id: params.fileId,
        projectId: params.id
      },
      data: {
        ...(content !== undefined && { content }),
        ...(name && { name }),
        ...(language && { language }),
        ...(path && { path })
      }
    })

    if (file.count === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const updatedFile = await db.file.findUnique({
      where: { id: params.fileId }
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const result = await db.file.deleteMany({
      where: { 
        id: params.fileId,
        projectId: params.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}