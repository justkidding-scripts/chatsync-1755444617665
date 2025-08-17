// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "OPENAI_API_KEY",
    description: "OpenAI API key for ChatGPT API access",
    required: false,
    instructions: "Go to [OpenAI Platform](https://platform.openai.com/api-keys) → Create new secret key → Copy the sk-... key.\n This is optional - you can also configure it in the application interface."
  },
  {
    name: "GITHUB_TOKEN",
    description: "GitHub Personal Access Token for repository uploads",
    required: false,
    instructions: "Go to [GitHub Settings](https://github.com/settings/tokens) → Personal access tokens → Generate new token → Select 'repo' scope → Copy the ghp_... token.\n This is optional - you can also configure it in the application interface."
  },
  {
    name: "GITHUB_REPO",
    description: "GitHub repository for uploading chat logs (format: username/repository-name)",
    required: false,
    instructions: "Specify the GitHub repository where chat logs will be uploaded in the format 'username/repository-name' (e.g., 'john/chat-history').\n This is optional - you can also configure it in the application interface."
  }
];

// SUPABASE/DATABASE VARIABLES (uncomment and add to ENV_VARIABLES array when adding database features)
// {
//   name: "DATABASE_URL",
//   description: "Supabase PostgreSQL database connection string for migrations and server-side operations",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Database → Connection string (URI format).\n Copy the full postgresql:// connection string.\n Make sure to replace [YOUR-PASSWORD] with actual password"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_URL",
//   description: "Supabase project URL for client-side authentication and API calls",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → Data API → Copy the 'Project URL -> URL' field (format: https://[project-id].supabase.co)"
// },
// {
//   name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
//   description: "Supabase anonymous/publishable key for client-side authentication",
//   required: true,
//   instructions: "Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API Keys → Copy 'Legacy API keys → anon public' key"
// }

export interface EnvVariable {
  name: string
  description: string
  instructions: string
  required: boolean
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(envVar => envVar.required && !process.env[envVar.name]).map(envVar => envVar.name)
}