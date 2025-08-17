import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, uploadTime, scriptPath } = await request.json()

    if (action === 'create') {
      // Generate PowerShell command to create Windows Task Scheduler task
      const taskName = 'ChatGPT-Logger-Upload'
      const [hour, minute] = uploadTime.split(':')
      
      const powershellCommand = `
$action = New-ScheduledTaskAction -Execute "python" -Argument "${scriptPath}"
$trigger = New-ScheduledTaskTrigger -Daily -At "${uploadTime}"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive
Register-ScheduledTask -TaskName "${taskName}" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
      `.trim()

      return NextResponse.json({
        success: true,
        powershellCommand,
        taskName,
        message: 'PowerShell command generated for Windows Task Scheduler'
      })
    }

    if (action === 'remove') {
      const taskName = 'ChatGPT-Logger-Upload'
      const powershellCommand = `Unregister-ScheduledTask -TaskName "${taskName}" -Confirm:$false`
      
      return NextResponse.json({
        success: true,
        powershellCommand,
        taskName,
        message: 'PowerShell command generated to remove scheduled task'
      })
    }

    if (action === 'status') {
      const taskName = 'ChatGPT-Logger-Upload'
      const powershellCommand = `Get-ScheduledTask -TaskName "${taskName}" -ErrorAction SilentlyContinue`
      
      return NextResponse.json({
        success: true,
        powershellCommand,
        taskName,
        message: 'PowerShell command generated to check task status'
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Windows scheduler error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process Windows scheduler request' 
    }, { status: 500 })
  }
}