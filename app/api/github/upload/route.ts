import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { chatHistory, githubToken, githubRepo } = await request.json()

    if (!chatHistory || !githubToken || !githubRepo) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const fileName = `logs/${today}.json`
    const content = JSON.stringify(chatHistory, null, 2)
    const encodedContent = Buffer.from(content).toString('base64')

    // Check if file exists first
    const checkResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${fileName}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )

    let sha: string | undefined

    if (checkResponse.ok) {
      const existingFile = await checkResponse.json()
      sha = existingFile.sha
    }

    // Create or update file
    const uploadResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/contents/${fileName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update chat logs for ${today}`,
          content: encodedContent,
          ...(sha && { sha })
        }),
      }
    )

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json()
      return NextResponse.json(
        { error: errorData.message || 'GitHub API error' },
        { status: uploadResponse.status }
      )
    }

    const uploadData = await uploadResponse.json()

    return NextResponse.json({
      success: true,
      url: uploadData.content?.html_url,
      message: `Chat logs uploaded successfully for ${today}`,
      date: today
    })

  } catch (error) {
    console.error('GitHub upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}