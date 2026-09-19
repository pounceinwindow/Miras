import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { Layout } from './components/Layout'
import Explore from './pages/Explore'
const MapPage = lazy(() => import('./pages/MapPage'))
const Encounter = lazy(() => import('./pages/Encounter'))
const Collection = lazy(() => import('./pages/Collection'))
const Entity = lazy(() => import('./pages/Entity'))
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
              <Route path="map" element={<MapPage />} />
              <Route path="scan" element={<Navigate to="/home" replace />} />
              <Route path="entity/:id" element={<Entity />} />
              <Route path="encounter/:token" element={<Encounter />} />
              <Route path="collection" element={<Collection />} />
              <Route path="fight/:character" element={<Battle />} />
              <Route path="battle" element={<Navigate to="/home" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Эта тропа ещё не открыта</h1>
                    <Link className="button" to="/">
                      На главную
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
