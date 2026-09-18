import { useParams } from 'react-router-dom'
import { getQuiz } from '../api/encounters'
import { useApiQuery } from '../hooks/useApiQuery'
import { EncounterFlow } from '../components/EncounterFlow'
import { QueryState } from '../components/QueryState'
export default function Quiz() {
  const { id = '' } = useParams()
  const result = useApiQuery(getQuiz, id)
  if (!result?.data) return <QueryState error={result?.error} />
  return (
    <EncounterFlow
      key={id}
      character={result.data.entity}
      questions={result.data.questions}
      quiz
    />
  )
}
