// Environment validation and header utilities

export const env = {
  JIRA_BASE_URL: process.env.JIRA_BASE_URL,
  JIRA_EMAIL: process.env.JIRA_EMAIL,
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
}

export function validateEnv(): void {
  if (!env.JIRA_BASE_URL) {
    throw new Error("JIRA_BASE_URL environment variable is not configured")
  }
  if (!env.JIRA_EMAIL) {
    throw new Error("JIRA_EMAIL environment variable is not configured")
  }
  if (!env.JIRA_API_TOKEN) {
    throw new Error("JIRA_API_TOKEN environment variable is not configured")
  }
}

export function getJiraHeaders(): HeadersInit {
  validateEnv()

  const auth = Buffer.from(`${env.JIRA_EMAIL}:${env.JIRA_API_TOKEN}`).toString("base64")

  return {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  }
}

export async function handleJiraResponse(response: Response, operation: string): Promise<any> {
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Jira API Error during ${operation}: ${response.status} - ${errorText}`)
    throw new Error(`Jira API Error (${response.status}): ${errorText}`)
  }

  try {
    const data = await response.json()
    console.log(`✅ Successfully completed ${operation}`)
    return data
  } catch (error) {
    console.error(`Failed to parse JSON response during ${operation}:`, error)
    throw new Error(`Invalid JSON response from Jira API during ${operation}`)
  }
}
