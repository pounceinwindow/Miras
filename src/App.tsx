import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { Layout } from './components/Layout'
import Explore from './pages/Explore'
const Encounter = lazy(() => import('./pages/Encounter'))
const Collection = lazy(() => import('./pages/Collection'))
const Entity = lazy(() => import('./pages/Entity'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Battle = lazy(() => import('./pages/Battle'))
const Profile = lazy(() => import('./pages/Profile'))
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="loading-screen" role="status">
              Открываем мир Мирас…
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Explore />} />
              <Route path="entity/:id" element={<Entity />} />
              <Route path="quiz/:id" element={<Quiz />} />
              <Route path="encounter/:token" element={<Encounter />} />
              <Route path="collection" element={<Collection />} />
              <Route path="battle" element={<Battle />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Эта тропа ещё не открыта</h1>
                    <Link className="button" to="/">
                      Вернуться к карте
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MotionConfig>
  )
}
