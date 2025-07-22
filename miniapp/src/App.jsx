import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ServicesPage } from './pages/ServicesPage'
import { OrderPage } from './pages/OrderPage'
import { ProfilePage } from './pages/ProfilePage'
import {Navigation} from './components/Navigation'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Получаем данные пользователя из Telegram
    const tg = window.Telegram?.WebApp
    if (tg?.initDataUnsafe?.user) {
      setUser(tg.initDataUnsafe.user)
      console.log('User loaded:', tg.initDataUnsafe.user)
    } else {
      console.log('No Telegram user data available')
    }
  }, [])

  return (
    <Router>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}>
        <Routes>
          <Route path="/" element={<ServicesPage user={user} />} />
          <Route path="/order/:serviceId" element={<OrderPage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  )
}

export default App
