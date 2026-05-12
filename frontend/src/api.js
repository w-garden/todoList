import { getIdToken } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getIdToken()}`,
  }
}

export async function getTodos() {
  const res = await fetch(`${BASE_URL}/todos`, { headers: headers() })
  if (!res.ok) throw new Error('목록 조회 실패')
  return res.json()
}

export async function createTodo(data) {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('추가 실패')
  return res.json()
}

export async function updateTodo(todoId, data) {
  const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('수정 실패')
  return res.json()
}

export async function deleteTodo(todoId) {
  const res = await fetch(`${BASE_URL}/todos/${todoId}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok) throw new Error('삭제 실패')
}
