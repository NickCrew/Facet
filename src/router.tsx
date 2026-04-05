import { lazy } from 'react'
import { createRouter, createRootRoute, createRoute, redirect } from '@tanstack/react-router'
import { AppShell } from './components/AppShell'
import { BuildPage } from './routes/build/BuildPage'
import { PipelinePage } from './routes/pipeline/PipelinePage'
import { RecruiterPage } from './routes/recruiter/RecruiterPage'

// AI-dependent routes — lazy-loaded so they code-split into separate chunks
const LazyIdentityPage = lazy(() => import('./routes/identity/IdentityPage').then((m) => ({ default: m.IdentityPage })))
const LazyMatchPage = lazy(() => import('./routes/match/MatchPage').then((m) => ({ default: m.MatchPage })))
const LazyResearchPage = lazy(() => import('./routes/research/ResearchPage').then((m) => ({ default: m.ResearchPage })))
const LazyPrepPage = lazy(() => import('./routes/prep/PrepPage').then((m) => ({ default: m.PrepPage })))
const LazyLettersPage = lazy(() => import('./routes/letters/LettersPage').then((m) => ({ default: m.LettersPage })))
const LazyLinkedInPage = lazy(() => import('./routes/linkedin/LinkedInPage').then((m) => ({ default: m.LinkedInPage })))
const LazyDebriefPage = lazy(() => import('./routes/debrief/DebriefPage').then((m) => ({ default: m.DebriefPage })))
const LazyHelpPage = lazy(() => import('./routes/help/HelpPage').then((m) => ({ default: m.HelpPage })))

const rootRoute = createRootRoute({
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/build' })
  },
})

const buildRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/build',
  component: BuildPage,
})

const identityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/identity',
  component: LazyIdentityPage,
})

const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/match',
  component: LazyMatchPage,
})

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pipeline',
  component: PipelinePage,
})

const researchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/research',
  component: LazyResearchPage,
})

const prepRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/prep',
  component: LazyPrepPage,
  validateSearch: (search: Record<string, unknown>) => ({
    vector: (search.vector as string) ?? '',
    skills: (search.skills as string) ?? '',
    q: (search.q as string) ?? '',
  }),
})

const lettersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/letters',
  component: LazyLettersPage,
})

const linkedInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/linkedin',
  component: LazyLinkedInPage,
})

const recruiterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recruiter',
  component: RecruiterPage,
})

const debriefRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debrief',
  component: LazyDebriefPage,
})

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: LazyHelpPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  buildRoute,
  identityRoute,
  matchRoute,
  pipelineRoute,
  researchRoute,
  prepRoute,
  lettersRoute,
  linkedInRoute,
  recruiterRoute,
  debriefRoute,
  helpRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
