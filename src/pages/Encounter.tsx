import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { startEncounter } from '../api/encounters'
import { useApiQuery } from '../hooks/useApiQuery'
import EntityPage from './Entity'
import { QueryState } from '../components/QueryState'
import { trackEvent } from '../lib/analytics'

export default function Encounter() {
  const { token = '' } = useParams()
  useEffect(() => {
    trackEvent('story_opened', { token })
  }, [token])
  const result = useApiQuery(startEncounter, token)
  if (!result?.data) return <QueryState error={result?.error} />
  return <EntityPage key={token} character={result.data} isEncounter={true} />
}
