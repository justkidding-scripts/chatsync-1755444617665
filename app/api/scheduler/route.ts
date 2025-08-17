import { NextRequest, NextResponse } from 'next/server'

interface SchedulerData {
  action: 'start' | 'stop' | 'status'
  uploadTime?: string
  config?: {
    githubToken: string
    githubRepo: string
  }
}

// Simple in-memory storage for demo (in production, use a database)
let schedulerState = {
  isRunning: false,
  uploadTime: '22:00',
  lastCheck: null as string | null,
  config: null as any
}

export async function GET() {
  return NextResponse.json({
    isRunning: schedulerState.isRunning,
    uploadTime: schedulerState.uploadTime,
    lastCheck: schedulerState.lastCheck
  })
}

export async function POST(request: NextRequest) {
  try {
    const { action, uploadTime, config }: SchedulerData = await request.json()

    switch (action) {
      case 'start':
        if (!config?.githubToken || !config?.githubRepo) {
          return NextResponse.json(
            { error: 'GitHub configuration required to start scheduler' },
            { status: 400 }
          )
        }
        
        schedulerState.isRunning = true
        schedulerState.config = config
        if (uploadTime) {
          schedulerState.uploadTime = uploadTime
        }
        
        return NextResponse.json({
          message: 'Scheduler started successfully',
          isRunning: true,
          uploadTime: schedulerState.uploadTime
        })

      case 'stop':
        schedulerState.isRunning = false
        schedulerState.config = null
        
        return NextResponse.json({
          message: 'Scheduler stopped successfully',
          isRunning: false
        })

      case 'status':
        return NextResponse.json({
          isRunning: schedulerState.isRunning,
          uploadTime: schedulerState.uploadTime,
          lastCheck: schedulerState.lastCheck
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function for scheduled uploads (would be triggered by a cron job in production)
async function triggerScheduledUpload() {
  if (!schedulerState.isRunning || !schedulerState.config) {
    return { success: false, message: 'Scheduler not running or not configured' }
  }

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  if (currentTime === schedulerState.uploadTime) {
    try {
      // Get today's chat history from localStorage would need to be handled client-side
      // This is a simplified version for the API
      schedulerState.lastCheck = new Date().toISOString()
      
      return { 
        success: true, 
        message: `Scheduled upload triggered at ${currentTime}`,
        lastCheck: schedulerState.lastCheck
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to perform scheduled upload',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return { success: false, message: 'Not time for scheduled upload yet' }
}