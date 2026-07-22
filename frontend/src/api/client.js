import axios from 'axios'

// Set VITE_API_URL in a .env file for local dev (e.g. http://localhost:8000)
// and as an environment variable in Vercel pointing at your deployed Render backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

export async function predictTransaction(transaction) {
  const { data } = await client.post('/api/predict', transaction)
  return data
}

export async function getDashboardStats() {
  const { data } = await client.get('/api/stats')
  return data
}

export async function checkHealth() {
  const { data } = await client.get('/api/health')
  return data
}

export async function getRecentStream(limit = 15) {
  const { data } = await client.get('/api/stream/recent', { params: { limit } })
  return data
}

export async function getNextStreamItem() {
  const { data } = await client.get('/api/stream/next')
  return data
}

export default client
