import { useEffect, useState } from 'react'
import { isLoggedIn, loginUrl, logoutUrl, exchangeCodeForTokens, saveTokens, clearTokens } from './auth'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'

const CATEGORIES = ['전체', '업무', '개인', '교회']

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [todos, setTodos] = useState([])
  const [filter, setFilter] = useState('전체')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('개인')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cognito 콜백 처리 (로컬 개발 시 자동 로그인)
  useEffect(() => {
    const isLocal = import.meta.env.VITE_CLIENT_ID === 'local'
    if (isLocal) {
      localStorage.setItem('id_token', 'local-test-token')
      setLoggedIn(true)
      setLoading(false)
      return
    }
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      exchangeCodeForTokens(code)
        .then(tokens => {
          saveTokens(tokens)
          window.history.replaceState({}, '', '/')
          setLoggedIn(true)
        })
        .catch(e => setError(e.message))
    } else {
      setLoggedIn(isLoggedIn())
    }
    setLoading(false)
  }, [])

  // 로그인 후 목록 조회
  useEffect(() => {
    if (!loggedIn) return
    getTodos()
      .then(setTodos)
      .catch(e => setError(e.message))
  }, [loggedIn])

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) return
    try {
      const todo = await createTodo({ title, category, dueDate: dueDate || null })
      setTodos(prev => [todo, ...prev])
      setTitle('')
      setDueDate('')
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleToggle(todo) {
    try {
      const updated = await updateTodo(todo.todoId, { done: !todo.done })
      setTodos(prev => prev.map(t => t.todoId === todo.todoId ? updated : t))
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete(todoId) {
    try {
      await deleteTodo(todoId)
      setTodos(prev => prev.filter(t => t.todoId !== todoId))
    } catch (e) {
      setError(e.message)
    }
  }

  function handleLogout() {
    clearTokens()
    window.location.href = logoutUrl()
  }

  const filtered = filter === '전체' ? todos : todos.filter(t => t.category === filter)

  if (loading) return <div style={styles.center}>로딩 중...</div>

  if (!loggedIn) return (
    <div style={styles.center}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Todo</h1>
        <p style={{ color: '#8898cc', marginBottom: 24 }}>로그인하여 시작하세요</p>
        <button style={styles.btnPrimary} onClick={async () => window.location.href = await loginUrl()}>
          로그인
        </button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Todo</h1>
        <button style={styles.btnSmall} onClick={handleLogout}>로그아웃</button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* 추가 폼 */}
      <form onSubmit={handleAdd} style={styles.form}>
        <input
          style={styles.input}
          placeholder="할 일 입력..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <select style={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
        </select>
        <input
          type="date"
          style={styles.input}
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
        <button type="submit" style={styles.btnPrimary}>추가</button>
      </form>

      {/* 카테고리 필터 */}
      <div style={styles.filterRow}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            style={{ ...styles.filterBtn, ...(filter === c ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Todo 목록 */}
      <div style={styles.list}>
        {filtered.length === 0 && <p style={{ color: '#8898cc', textAlign: 'center' }}>할 일이 없습니다.</p>}
        {filtered.map(todo => (
          <div key={todo.todoId} style={styles.todoItem}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => handleToggle(todo)}
              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#5080e0' }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ ...styles.todoTitle, ...(todo.done ? styles.done : {}) }}>
                {todo.title}
              </span>
              <div style={styles.meta}>
                <span style={styles.badge}>{todo.category}</span>
                {todo.dueDate && <span style={{ color: '#8898cc', fontSize: 12 }}>{todo.dueDate}</span>}
              </div>
            </div>
            <button style={styles.deleteBtn} onClick={() => handleDelete(todo.todoId)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
  card: { background: '#1a2040', borderRadius: 16, padding: 36, width: '100%', maxWidth: 400, textAlign: 'center' },
  container: { maxWidth: 600, margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontSize: 24, fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  input: { background: '#1a2040', border: '1px solid #2a3560', borderRadius: 8, color: '#fff', padding: '10px 14px', fontSize: 15, outline: 'none', width: '100%' },
  select: { background: '#1a2040', border: '1px solid #2a3560', borderRadius: 8, color: '#fff', padding: '10px 14px', fontSize: 15, outline: 'none', width: '100%' },
  btnPrimary: { background: '#5080e0', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSmall: { background: '#2a3560', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterBtn: { background: '#1a2040', color: '#8898cc', border: '1px solid #2a3560', borderRadius: 20, padding: '6px 16px', fontSize: 13, cursor: 'pointer' },
  filterBtnActive: { background: '#5080e0', color: '#fff', borderColor: '#5080e0' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  todoItem: { background: '#1a2040', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  todoTitle: { fontSize: 15, display: 'block' },
  done: { textDecoration: 'line-through', color: '#8898cc' },
  meta: { display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' },
  badge: { background: '#2a3560', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#8898cc' },
  deleteBtn: { background: 'none', border: 'none', color: '#8898cc', cursor: 'pointer', fontSize: 16, padding: 4 },
  errorBox: { background: '#301a20', border: '1px solid #602a40', borderRadius: 8, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#ff8080' },
}
