"use server"

// Minimal test function that returns only plain objects
export async function testMinimalConnection() {
  try {
    console.log("🧪 Running minimal connection test...")

    // Check environment variables (these are configured in v0.dev)
    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const token = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !token) {
      return {
        success: false,
        error: "Missing environment variables - please check v0.dev configuration",
        details: {
          hasBaseUrl: !!baseUrl,
          hasEmail: !!email,
          hasToken: !!token,
        },
      }
    }

    // Create auth header
    const auth = Buffer.from(`${email}:${token}`).toString("base64")

    // Make request
    const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status,
      }
    }

    const rawData = await response.json()
    console.log("🔍 Raw Jira response:", rawData)

    // Create completely new plain object with only the data we need
    const cleanUser = {
      displayName: String(rawData.displayName || "Unknown"),
      emailAddress: String(rawData.emailAddress || "unknown@example.com"),
      accountId: String(rawData.accountId || "unknown"),
      timeZone: String(rawData.timeZone || "UTC"),
    }

    console.log("✅ Clean user object:", cleanUser)

    // 🔒 Freeze object in development to catch mutations
    const frozenUser = process.env.NODE_ENV === "development" ? Object.freeze(cleanUser) : cleanUser

    return {
      success: true,
      user: frozenUser,
      message: "Connection successful",
    }
  } catch (error) {
    console.error("❌ Minimal test failed:", error)

    // Return completely plain error object
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.constructor.name : "Unknown",
    }
  }
}

export async function testMinimalProjects() {
  try {
    console.log("🧪 Testing minimal projects fetch...")

    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const token = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !token) {
      return {
        success: false,
        error: "Missing environment variables - please check v0.dev configuration",
      }
    }

    const auth = Buffer.from(`${email}:${token}`).toString("base64")

    const response = await fetch(`${baseUrl}/rest/api/3/project`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }
    }

    const rawProjects = await response.json()
    console.log("🔍 Raw projects response type:", typeof rawProjects)
    console.log("🔍 Raw projects is array:", Array.isArray(rawProjects))

    if (!Array.isArray(rawProjects)) {
      return {
        success: false,
        error: "Projects response is not an array",
        responseType: typeof rawProjects,
      }
    }

    // Create completely clean project objects
    const cleanProjects = rawProjects.map((project: any) => {
      const cleanProject = {
        id: String(project.id || "unknown"),
        key: String(project.key || "unknown"),
        name: String(project.name || "Unnamed Project"),
        projectTypeKey: String(project.projectTypeKey || "unknown"),
      }

      // 🔒 Freeze each project object in development to catch mutations
      return process.env.NODE_ENV === "development" ? Object.freeze(cleanProject) : cleanProject
    })

    console.log("✅ Clean projects:", cleanProjects.length, "projects")

    return {
      success: true,
      projects: cleanProjects,
      count: cleanProjects.length,
    }
  } catch (error) {
    console.error("❌ Minimal projects test failed:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
