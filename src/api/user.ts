import { createMockUser } from '../mocks/user'
import { request } from './client'
import type { Progress } from './types'
export const getInitialProgress = () => createMockUser()
export const getUser = (progress: Progress) =>
  request({ type: 'sync' }, progress)
