# ChatGPT Conversation Logger

A comprehensive web application that captures, stores, and automatically backs up your ChatGPT conversations to GitHub. Features a beautiful GUI with an installation wizard and automated scheduling system.

## Features

### 🎯 Core Functionality
- **Real-time Chat Interface**: Send messages to ChatGPT and receive responses through the OpenAI API
- **Automatic Logging**: All conversations are automatically saved with timestamps and model information
- **Daily Organization**: Chat logs are organized by date for easy retrieval
- **Local Storage**: Conversations are stored locally in your browser
- **Export Functionality**: Download daily chat logs as JSON files
- **Morning Prompt**: Automatic prompt each morning to copy yesterday's conversations
- **JSON Import**: Import existing ChatGPT conversation exports with chunked processing
- **Trial Mode**: Test your configuration to verify OpenAI and GitHub connectivity

### 🔧 Setup & Configuration
- **Installation Wizard**: Guided setup process with progress indicators
- **API Key Management**: Secure handling of OpenAI and GitHub credentials
- **Multiple Configuration Options**: Set up via environment variables or in-app interface
- **Model Selection**: Choose between GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo

### 📊 GitHub Integration
- **Automatic Backups**: Schedule daily uploads of chat histories to GitHub repositories
- **Manual Uploads**: Instantly upload current day's conversations
- **Repository Management**: Organize logs in a structured format in your GitHub repo
- **Upload Tracking**: Monitor last upload dates and scheduler status

### ⏰ Scheduling System
- **Automated Daily Uploads**: Set custom time for automatic GitHub uploads
- **Scheduler Management**: Start/stop scheduler with real-time status updates
- **Background Processing**: Non-intrusive automatic operations
- **Upload History**: Track when uploads were last performed

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and professional styling
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Real-time Notifications**: Toast messages for all user actions
- **Progress Tracking**: Visual feedback for installations and uploads
- **Intuitive Navigation**: Clean, organized interface with clear sections

## Quick Start

### 1. Environment Setup (Optional)
You can configure API keys via environment variables or through the application interface:

```bash
# Optional: Set environment variables
OPENAI_API_KEY=sk-your-openai-key
GITHUB_TOKEN=ghp_your-github-token
GITHUB_REPO=username/repository-name
```

### 2. Installation
```bash
# Install dependencies
npm install
# or
bun install

# Run development server
npm run dev
# or
bun dev
```

### 3. Configuration
1. Open the application in your browser
2. Complete the installation wizard:
   - Enter your OpenAI API key
   - Add your GitHub Personal Access Token
   - Specify your GitHub repository
   - Set your preferred upload time
3. Click "Install Dependencies & Configure"
4. Save your configuration

### 4. Usage
- **Send Messages**: Type in the chat interface and get responses from ChatGPT
- **View History**: Browse today's conversations in the history panel
- **Upload to GitHub**: Use manual upload or enable automatic scheduling
- **Export Data**: Download conversation logs as JSON files
- **Import Conversations**: Upload ChatGPT export JSON files to import historical conversations
- **Morning Workflow**: Each morning, get prompted to copy yesterday's conversations to today
- **Trial Testing**: Run connectivity tests to verify your OpenAI and GitHub configuration
- **Manage Settings**: Update configuration anytime through the settings panel

## API Endpoints

### Chat API
- `POST /api/chat` - Send prompts to OpenAI and receive responses
- Requires: `prompt`, `apiKey`, `model`
- Returns: `response`, `model`, `timestamp`

### GitHub Upload API
- `POST /api/github/upload` - Upload chat history to GitHub
- Requires: `chatHistory`, `githubToken`, `githubRepo`
- Returns: `success`, `url`, `message`, `date`

### Scheduler API
- `GET /api/scheduler` - Get scheduler status
- `POST /api/scheduler` - Control scheduler (start/stop/status)
- Actions: `start`, `stop`, `status`

## New Features

### 📅 Morning Prompt
Each morning when you open the application, you'll be prompted to copy yesterday's conversations:
- Automatically detects if you have conversations from the previous day
- One-click copying of all yesterday's conversations to today's session
- Can be enabled/disabled in settings
- Remembers if you've already been prompted today

### 📂 ChatGPT JSON Import
Import your existing ChatGPT conversation history:
- Supports ChatGPT export JSON format
- Handles both new mapping format and legacy message format
- Chunked processing to prevent UI freezing on large files
- Configurable chunk size (1-50 conversations per batch)
- Progress indicator during import
- Automatically organizes imported conversations by date

### 🧪 Trial Mode
Test your configuration before regular use:
- Tests OpenAI API connectivity with a sample prompt
- Verifies GitHub upload functionality if configured
- Provides clear success/failure feedback
- Helps troubleshoot configuration issues

## Configuration Options

### OpenAI API Key
Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys):
1. Create a new secret key
2. Copy the `sk-...` key
3. Add to environment variables or app interface

### GitHub Token
Create a Personal Access Token from [GitHub Settings](https://github.com/settings/tokens):
1. Generate new token
2. Select 'repo' scope for repository access
3. Copy the `ghp_...` token
4. Add to environment variables or app interface

### GitHub Repository
Specify repository in format `username/repository-name`:
- Example: `john/chat-history`
- Repository must exist and token must have write access
- Logs will be stored in `logs/YYYY-MM-DD.json` format

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **APIs**: OpenAI API, GitHub API
- **Storage**: Local Storage (browser-based)

## File Structure

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # OpenAI integration
│   │   ├── github/upload/route.ts  # GitHub upload functionality
│   │   └── scheduler/route.ts      # Automated scheduling
│   ├── layout.tsx                  # Root layout with toaster
│   └── page.tsx                    # Main application interface
├── lib/
│   └── env-config.ts              # Environment variable configuration
└── components/ui/                  # UI component library
```

## Data Format

Chat entries are stored in the following format:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "prompt": "User's question or message",
  "response": "ChatGPT's response",
  "model": "gpt-3.5-turbo"
}
```

## Security Notes

- API keys are handled securely and never exposed in client-side code
- All API calls are routed through secure server endpoints
- Local storage is used for client-side data persistence
- GitHub uploads use authenticated API calls with proper error handling

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check environment variables
# Visit /env-check in your browser
```

## Production Deployment

For production deployment, consider:
1. Setting up proper environment variables
2. Implementing database storage instead of localStorage
3. Adding user authentication and authorization
4. Setting up actual cron jobs for scheduled uploads
5. Adding rate limiting and error monitoring

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, create an issue in the GitHub repository or refer to the documentation above.