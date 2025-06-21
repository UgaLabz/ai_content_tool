interface AppConfig {
  api: {
    baseUrl: string
    timeout: number
  }
  features: {
    enableAnalytics: boolean
    enableDebug: boolean
  }
  app: {
    name: string
    version: string
  }
}

const getEnvVar = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue
}

const getEnvBool = (key: string, defaultValue = false): boolean => {
  const value = import.meta.env[key]
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

export const config: AppConfig = {
  api: {
    baseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api'),
    timeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '30000'), 10),
  },
  features: {
    enableAnalytics: getEnvBool('VITE_ENABLE_ANALYTICS', false),
    enableDebug: getEnvBool('VITE_ENABLE_DEBUG', true),
  },
  app: {
    name: 'AI Content Studio',
    version: '1.0.0',
  },
}

// Validate config in development
if (import.meta.env.DEV) {
  console.log('App Config:', config)
  
  if (!config.api.baseUrl) {
    console.warn('API base URL is not configured')
  }
}