import axios from 'axios'

const http = axios.create({
  // use relative base so Vite dev proxy handles requests in dev
  baseURL: '/',
  withCredentials: true, // include cookies if server uses them
  headers: {
    'Content-Type': 'application/json'
  }
})

export default http