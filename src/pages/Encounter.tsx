import { useParams } from 'react-router-dom'
import { startEncounter } from '../api/encounters'
import { useApiQuery } from '../hooks/useApiQuery'
import { EncounterFlow } from '../components/EncounterFlow'
import { QueryState } from '../components/QueryState'
export default function Encounter() {
  const { token = '' } = useParams()
  const result = useApiQuery(startEncounter, token)
  if (!result?.data) return <QueryState error={result?.error} />
  return <EncounterFlow key={token} character={result.data} />
}
