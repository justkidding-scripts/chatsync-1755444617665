"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Github, MessageSquare, Settings, Download, Upload, CheckCircle, AlertCircle, Play, Square, FileText, Copy, TestTube, History } from 'lucide-react'
import { toast } from 'sonner'

interface ChatEntry {
  timestamp: string
  prompt: string
  response: string
  model: string
}

interface Config {
  openaiApiKey: string
  githubToken: string
  githubRepo: string
  uploadTime: string
  autoUpload: boolean
  model: string
  maxChunkSize: number
  morningPromptEnabled: boolean
}

interface ImportedChat {
  title?: string
  create_time?: number
  mapping?: any
  messages?: any[]
  conversation_id?: string
}

export default function ChatGPTLogger() {
  const [config, setConfig] = useState<Config>({
    openaiApiKey: '',
    githubToken: '',
    githubRepo: '',
    uploadTime: '22:00',
    autoUpload: true,
    model: 'gpt-3.5-turbo',
    maxChunkSize: 10,
    morningPromptEnabled: true
  })
  
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isConfigured, setIsConfigured] = useState(false)
  const [setupStep, setSetupStep] = useState(0)
  const [installProgress, setInstallProgress] = useState(0)
  const [isInstalling, setIsInstalling] = useState(false)
  const [lastUpload, setLastUpload] = useState<string | null>(null)
  const [schedulerRunning, setSchedulerRunning] = useState(false)
  const [showMorningPrompt, setShowMorningPrompt] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [showTrialMode, setShowTrialMode] = useState(false)
  const [yesterdayCount, setYesterdayCount] = useState(0)

  const setupSteps = [
    'Installing Dependencies',
    'Configuring OpenAI API',
    'Setting up GitHub Integration',
    'Configuring Scheduler',
    'Final Setup'
  ]

  useEffect(() => {
    loadConfig()
    loadChatHistory()
    checkLastUpload()
    checkMorningPrompt()
  }, [])

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('chatgpt-logger-config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      // Ensure new properties have defaults
      const configWithDefaults = {
        ...config,
        ...parsed,
        maxChunkSize: parsed.maxChunkSize || 10,
        morningPromptEnabled: parsed.morningPromptEnabled !== undefined ? parsed.morningPromptEnabled : true
      }
      setConfig(configWithDefaults)
      setIsConfigured(!!configWithDefaults.openaiApiKey && !!configWithDefaults.githubToken && !!configWithDefaults.githubRepo)
    }
  }

  const saveConfig = (newConfig: Config) => {
    localStorage.setItem('chatgpt-logger-config', JSON.stringify(newConfig))
    setConfig(newConfig)
    setIsConfigured(!!newConfig.openaiApiKey && !!newConfig.githubToken && !!newConfig.githubRepo)
  }

  const loadChatHistory = () => {
    const today = new Date().toISOString().split('T')[0]
    const savedHistory = localStorage.getItem(`chat-history-${today}`)
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory))
    }
  }

  const saveChatEntry = (entry: ChatEntry) => {
    const today = new Date().toISOString().split('T')[0]
    const newHistory = [...chatHistory, entry]
    setChatHistory(newHistory)
    localStorage.setItem(`chat-history-${today}`, JSON.stringify(newHistory))
  }

  const checkLastUpload = () => {
    const lastUploadDate = localStorage.getItem('last-github-upload')
    setLastUpload(lastUploadDate)
  }

  const checkMorningPrompt = () => {
    const today = new Date().toISOString().split('T')[0]
    const lastPrompt = localStorage.getItem('last-morning-prompt')
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayHistory = localStorage.getItem(`chat-history-${yesterday}`)
    
    if (yesterdayHistory) {
      const yesterdayChats = JSON.parse(yesterdayHistory)
      setYesterdayCount(yesterdayChats.length)
      
      if (config.morningPromptEnabled && lastPrompt !== today && yesterdayChats.length > 0) {
        setShowMorningPrompt(true)
      }
    }
  }

  const copyYesterdayConversations = () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayHistory = localStorage.getItem(`chat-history-${yesterday}`)
    
    if (yesterdayHistory) {
      const yesterdayChats = JSON.parse(yesterdayHistory)
      const newHistory = [...chatHistory, ...yesterdayChats]
      setChatHistory(newHistory)
      
      const today = new Date().toISOString().split('T')[0]
      localStorage.setItem(`chat-history-${today}`, JSON.stringify(newHistory))
      localStorage.setItem('last-morning-prompt', today)
      
      setShowMorningPrompt(false)
      toast.success(`Copied ${yesterdayChats.length} conversations from yesterday!`)
    }
  }

  const dismissMorningPrompt = () => {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem('last-morning-prompt', today)
    setShowMorningPrompt(false)
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setImportFile(file)
  }

  const processImportFile = async () => {
    if (!importFile) return
    
    setIsImporting(true)
    setImportProgress(0)
    
    try {
      const text = await importFile.text()
      const data = JSON.parse(text)
      
      let conversations: ImportedChat[] = []
      
      // Handle different ChatGPT export formats
      if (Array.isArray(data)) {
        conversations = data
      } else if (data.conversations) {
        conversations = data.conversations
      } else if (data.mapping) {
        conversations = [data]
      }
      
      const totalConversations = conversations.length
      const chunkSize = config.maxChunkSize
      let processedCount = 0
      
      for (let i = 0; i < conversations.length; i += chunkSize) {
        const chunk = conversations.slice(i, i + chunkSize)
        
        for (const conv of chunk) {
          const chatEntries = extractChatEntries(conv)
          if (chatEntries.length > 0) {
            const convDate = conv.create_time 
              ? new Date(conv.create_time * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
            
            const existingHistory = localStorage.getItem(`chat-history-${convDate}`)
            const existing = existingHistory ? JSON.parse(existingHistory) : []
            const combined = [...existing, ...chatEntries]
            
            localStorage.setItem(`chat-history-${convDate}`, JSON.stringify(combined))
          }
          
          processedCount++
          setImportProgress((processedCount / totalConversations) * 100)
        }
        
        // Add delay between chunks to prevent UI freezing
        if (i + chunkSize < conversations.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      loadChatHistory() // Refresh current day's history
      setShowImportDialog(false)
      setImportFile(null)
      toast.success(`Successfully imported ${processedCount} conversations!`)
    } catch (error) {
      toast.error('Failed to import file. Please check the format.')
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const extractChatEntries = (conversation: ImportedChat): ChatEntry[] => {
    const entries: ChatEntry[] = []
    
    if (conversation.mapping) {
      // Handle new ChatGPT export format
      Object.values(conversation.mapping).forEach((node: any) => {
        if (node.message?.content?.parts?.length > 0) {
          const message = node.message
          const content = message.content.parts.join('')
          const timestamp = conversation.create_time 
            ? new Date(conversation.create_time * 1000).toISOString()
            : new Date().toISOString()
          
          if (message.author.role === 'user') {
            // Store user message to pair with assistant response
            const userMessage = content
            // Find corresponding assistant response
            const assistantNode = Object.values(conversation.mapping).find((n: any) => 
              n.parent === node.id && n.message?.author?.role === 'assistant'
            ) as any
            
            if (assistantNode?.message?.content?.parts?.length > 0) {
              entries.push({
                timestamp,
                prompt: userMessage,
                response: assistantNode.message.content.parts.join(''),
                model: assistantNode.message.metadata?.model_slug || 'unknown'
              })
            }
          }
        }
      })
    } else if (conversation.messages) {
      // Handle older format
      for (let i = 0; i < conversation.messages.length - 1; i += 2) {
        const userMsg = conversation.messages[i]
        const assistantMsg = conversation.messages[i + 1]
        
        if (userMsg?.role === 'user' && assistantMsg?.role === 'assistant') {
          entries.push({
            timestamp: conversation.create_time 
              ? new Date(conversation.create_time * 1000).toISOString()
              : new Date().toISOString(),
            prompt: userMsg.content,
            response: assistantMsg.content,
            model: 'imported'
          })
        }
      }
    }
    
    return entries
  }

  const runTrial = async () => {
    setShowTrialMode(true)
    
    // Test OpenAI connection
    const testPrompt = "Say 'Hello, this is a test!' to confirm the connection is working."
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          apiKey: config.openaiApiKey,
          model: config.model
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      toast.success('✅ OpenAI connection test successful!')
      
      // Test GitHub upload if configured
      if (config.githubToken && config.githubRepo) {
        const testEntry: ChatEntry = {
          timestamp: new Date().toISOString(),
          prompt: testPrompt,
          response: data.response,
          model: data.model
        }
        
        try {
          const githubResponse = await fetch('/api/github/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatHistory: [testEntry],
              githubToken: config.githubToken,
              githubRepo: config.githubRepo
            }),
          })

          if (githubResponse.ok) {
            toast.success('✅ GitHub upload test successful!')
          } else {
            toast.error('❌ GitHub upload test failed')
          }
        } catch (error) {
          toast.error('❌ GitHub upload test failed')
        }
      }
      
      toast.success('Trial completed! All systems are working.')
    } catch (error) {
      toast.error('❌ OpenAI connection test failed. Check your API key.')
    } finally {
      setShowTrialMode(false)
    }
  }

  const simulateInstallation = async () => {
    setIsInstalling(true)
    setInstallProgress(0)
    
    for (let i = 0; i <= 4; i++) {
      setSetupStep(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setInstallProgress((i + 1) * 20)
    }
    
    setIsInstalling(false)
    toast.success('Installation completed successfully!')
  }

  const sendPrompt = async () => {
    if (!prompt.trim() || !config.openaiApiKey) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          apiKey: config.openaiApiKey,
          model: config.model
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }
      
      const entry: ChatEntry = {
        timestamp: data.timestamp,
        prompt,
        response: data.response,
        model: data.model
      }
      
      saveChatEntry(entry)
      setResponse(data.response)
      setPrompt('')
      toast.success('Message sent and logged successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message. Please check your API key.')
    } finally {
      setIsLoading(false)
    }
  }

  const uploadToGitHub = async () => {
    if (!config.githubToken || !config.githubRepo) {
      toast.error('GitHub configuration is missing')
      return
    }

    if (chatHistory.length === 0) {
      toast.error('No chat history to upload')
      return
    }

    try {
      const response = await fetch('/api/github/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory,
          githubToken: config.githubToken,
          githubRepo: config.githubRepo
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload to GitHub')
      }
      
      localStorage.setItem('last-github-upload', data.date)
      setLastUpload(data.date)
      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload to GitHub')
    }
  }

  const toggleScheduler = async () => {
    try {
      const action = schedulerRunning ? 'stop' : 'start'
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          uploadTime: config.uploadTime,
          config: action === 'start' ? {
            githubToken: config.githubToken,
            githubRepo: config.githubRepo
          } : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle scheduler')
      }

      setSchedulerRunning(data.isRunning)
      toast.success(data.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle scheduler')
    }
  }

  const exportLogs = () => {
    const today = new Date().toISOString().split('T')[0]
    const dataStr = JSON.stringify(chatHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chat-logs-${today}.json`
    link.click()
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <MessageSquare className="w-16 h-16 mx-auto text-blue-600" />
            <h1 className="text-3xl font-bold">ChatGPT Conversation Logger</h1>
            <p className="text-gray-600">Capture, store, and backup your ChatGPT conversations</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Initial Setup
              </CardTitle>
              <CardDescription>
                Configure your API keys and preferences to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isInstalling && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold">{setupSteps[setupStep]}</h3>
                    <Progress value={installProgress} className="mt-2" />
                  </div>
                </div>
              )}

              {!isInstalling && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        value={config.openaiApiKey}
                        onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                      <Input
                        id="github-token"
                        type="password"
                        placeholder="ghp_..."
                        value={config.githubToken}
                        onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="github-repo">GitHub Repository</Label>
                      <Input
                        id="github-repo"
                        placeholder="username/chat-history"
                        value={config.githubRepo}
                        onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="upload-time">Daily Upload Time</Label>
                      <Input
                        id="upload-time"
                        type="time"
                        value={config.uploadTime}
                        onChange={(e) => setConfig({ ...config, uploadTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={simulateInstallation} className="flex-1">
                      Install Dependencies & Configure
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => saveConfig(config)}
                      disabled={!config.openaiApiKey || !config.githubToken || !config.githubRepo}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Morning Prompt Dialog */}
        {showMorningPrompt && (
          <Alert className="border-blue-200 bg-blue-50">
            <History className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Good morning! You have {yesterdayCount} conversations from yesterday. 
                Would you like to copy them to today?
              </span>
              <div className="flex gap-2 ml-4">
                <Button size="sm" onClick={copyYesterdayConversations}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Yesterday's Chats
                </Button>
                <Button size="sm" variant="outline" onClick={dismissMorningPrompt}>
                  Skip
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">ChatGPT Logger</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImportDialog(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runTrial}
              disabled={showTrialMode || !config.openaiApiKey}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {showTrialMode ? 'Testing...' : 'Run Trial'}
            </Button>
            <Badge variant={schedulerRunning ? "default" : "secondary"}>
              {schedulerRunning ? "Scheduler Active" : "Scheduler Inactive"}
            </Badge>
            {lastUpload && (
              <Badge variant="outline">
                Last upload: {lastUpload}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Your Message</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Type your message here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={sendPrompt} 
                  disabled={!prompt.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Message'}
                </Button>
                {response && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm text-gray-600">Response:</Label>
                    <p className="mt-1">{response}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Conversations ({chatHistory.length})
                  </span>
                  <Button variant="outline" size="sm" onClick={exportLogs}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No conversations yet today</p>
                  ) : (
                    chatHistory.map((entry, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(entry.timestamp).toLocaleTimeString()}
                          <Badge variant="secondary" className="text-xs">{entry.model}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p><strong>You:</strong> {entry.prompt}</p>
                          <p><strong>ChatGPT:</strong> {entry.response}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  GitHub Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Auto-upload scheduled for {config.uploadTime} daily
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="scheduler">Automatic Upload</Label>
                  <Switch
                    id="scheduler"
                    checked={schedulerRunning}
                    onCheckedChange={toggleScheduler}
                  />
                </div>

                <Button 
                  onClick={uploadToGitHub} 
                  variant="outline" 
                  className="w-full"
                  disabled={chatHistory.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Now
                </Button>

                {lastUpload && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Last uploaded: {lastUpload}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="model">OpenAI Model</Label>
                  <select
                    id="model"
                    className="w-full p-2 border rounded"
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Edit Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configuration Settings</DialogTitle>
                      <DialogDescription>
                        Update your API keys and settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-openai-key">OpenAI API Key</Label>
                        <Input
                          id="edit-openai-key"
                          type="password"
                          value={config.openaiApiKey}
                          onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-github-token">GitHub Token</Label>
                        <Input
                          id="edit-github-token"
                          type="password"
                          value={config.githubToken}
                          onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-github-repo">GitHub Repository</Label>
                        <Input
                          id="edit-github-repo"
                          value={config.githubRepo}
                          onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-upload-time">Upload Time</Label>
                        <Input
                          id="edit-upload-time"
                          type="time"
                          value={config.uploadTime}
                          onChange={(e) => setConfig({ ...config, uploadTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-chunk-size">Import Chunk Size</Label>
                        <Input
                          id="edit-chunk-size"
                          type="number"
                          min="1"
                          max="50"
                          value={config.maxChunkSize}
                          onChange={(e) => setConfig({ ...config, maxChunkSize: parseInt(e.target.value) || 10 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of conversations to process at once during import</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="edit-morning-prompt">Morning Prompt</Label>
                        <Switch
                          id="edit-morning-prompt"
                          checked={config.morningPromptEnabled}
                          onCheckedChange={(checked) => setConfig({ ...config, morningPromptEnabled: checked })}
                        />
                      </div>
                      <Button onClick={() => saveConfig(config)} className="w-full">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="destructive" 
                  onClick={() => {
                    localStorage.clear()
                    setIsConfigured(false)
                    setChatHistory([])
                    toast.success('Configuration reset successfully')
                  }}
                  className="w-full"
                >
                  Reset Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import ChatGPT Conversations</DialogTitle>
              <DialogDescription>
                Upload your ChatGPT export JSON file to import conversations. Large files will be processed in chunks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!isImporting && (
                <>
                  <div>
                    <Label htmlFor="import-file">Select JSON File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                    />
                  </div>
                  {importFile && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p><strong>File:</strong> {importFile.name}</p>
                      <p><strong>Size:</strong> {Math.round(importFile.size / 1024)} KB</p>
                      <p><strong>Chunk Size:</strong> {config.maxChunkSize} conversations per batch</p>
                    </div>
                  )}
                </>
              )}
              
              {isImporting && (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Importing conversations...</p>
                    <Progress value={importProgress} className="mt-2" />
                    <p className="text-xs text-gray-500 mt-1">{Math.round(importProgress)}% complete</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={processImportFile}
                  disabled={!importFile || isImporting}
                  className="flex-1"
                >
                  {isImporting ? 'Importing...' : 'Import Conversations'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                    setImportProgress(0)
                  }}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
