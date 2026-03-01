// @vitest-environment jsdom
import { useEffect } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssembledResume, ResumeTheme } from '../types'
import { usePdfPreview, type UsePdfPreviewState } from '../hooks/usePdfPreview'
import { renderResumeAsPdf } from '../utils/typstRenderer'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../utils/typstRenderer', () => ({
  renderResumeAsPdf: vi.fn(),
}))

interface HarnessProps {
  resume: AssembledResume
  theme: ResumeTheme
  debounceMs?: number
  onState: (state: UsePdfPreviewState) => void
}

function PreviewHarness({ resume, theme, debounceMs, onState }: HarnessProps) {
  const state = usePdfPreview({
    resume,
    theme,
    ...(debounceMs === undefined ? {} : { debounceMs }),
  })

  useEffect(() => {
    onState(state)
  }, [onState, state])

  return null
}

const createResume = (name: string): AssembledResume => ({
  selectedVector: 'all',
  header: {
    name,
    email: 'test@example.com',
    phone: '555-111-2222',
    location: 'Austin, TX',
    links: [],
  },
  profile: { id: 'profile-1', text: 'Profile text', priority: 'must' },
  skillGroups: [],
  roles: [],
  projects: [],
  education: [],
})

const createTheme = (): ResumeTheme => ({
  id: 'ferguson-v12',
  name: 'Ferguson v1.2',
  fontBody: 'Inter',
  fontHeading: 'Inter',
  sizeBody: 9,
  sizeName: 14,
  sizeSectionHeader: 10.5,
  sizeRoleTitle: 9,
  sizeCompanyName: 10,
  sizeSmall: 8.5,
  sizeContact: 8.5,
  lineHeight: 1.15,
  bulletGap: 2.5,
  sectionGapBefore: 10,
  sectionGapAfter: 3,
  roleGap: 7,
  roleLineGapAfter: 3,
  paragraphGap: 2,
  contactGapAfter: 6,
  competencyGap: 1,
  projectGap: 3,
  marginTop: 0.45,
  marginBottom: 0.45,
  marginLeft: 0.75,
  marginRight: 0.75,
  colorBody: '333333',
  colorHeading: '1a1a1a',
  colorSection: '2b5797',
  colorDim: '666666',
  colorRule: '2b5797',
  roleTitleColor: '1a1a1a',
  datesColor: '666666',
  subtitleColor: '666666',
  competencyLabelColor: '1a1a1a',
  projectUrlColor: '2b5797',
  sectionHeaderStyle: 'caps-rule',
  sectionHeaderLetterSpacing: 3,
  sectionRuleWeight: 0.5,
  nameLetterSpacing: 4,
  nameBold: true,
  nameAlignment: 'center',
  contactAlignment: 'center',
  roleTitleItalic: true,
  datesAlignment: 'right-tab',
  subtitleItalic: true,
  companyBold: true,
  bulletChar: '•',
  bulletIndent: 18,
  bulletHanging: 10,
  competencyLabelBold: true,
  projectNameBold: true,
  projectUrlSize: 8.5,
  educationSchoolBold: true,
})

const makeDeferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined
  let reject: (error?: unknown) => void = () => undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

const mockedRenderResumeAsPdf = vi.mocked(renderResumeAsPdf)

describe('usePdfPreview', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null
  let latestState: UsePdfPreviewState | null = null
  let createObjectURLMock: ReturnType<typeof vi.fn>
  let revokeObjectURLMock: ReturnType<typeof vi.fn>

  const renderHarness = async (resume: AssembledResume, theme: ResumeTheme, debounceMs?: number) => {
    await act(async () => {
      root?.render(
        <PreviewHarness
          resume={resume}
          theme={theme}
          debounceMs={debounceMs}
          onState={(state) => (latestState = state)}
        />,
      )
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    latestState = null
    mockedRenderResumeAsPdf.mockReset()

    createObjectURLMock = vi.fn().mockReturnValue('blob:preview')
    revokeObjectURLMock = vi.fn()
    ;(URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock
    ;(URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }
    root = null
    container?.remove()
    container = null

    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders a debounced PDF and exposes preview state', async () => {
    const resume = createResume('First Resume')
    const theme = createTheme()
    const expectedBlob = new Blob(['pdf-one'], { type: 'application/pdf' })

    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: expectedBlob,
      bytes: new Uint8Array([1]),
      pageCount: 2,
      generatedAt: '2026-02-28T09:00:00.000Z',
    })

    await renderHarness(resume, theme)

    expect(mockedRenderResumeAsPdf).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(399)
    })
    expect(mockedRenderResumeAsPdf).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledWith(resume, theme)
    expect(createObjectURLMock).toHaveBeenCalledWith(expectedBlob)
    expect(latestState).toMatchObject({
      previewBlobUrl: 'blob:preview',
      pageCount: 2,
      pending: false,
      error: null,
    })
    expect(latestState?.cachedPdfBlob).toBe(expectedBlob)
  })

  it('sets pending immediately and clears prior errors when a new cycle begins', async () => {
    mockedRenderResumeAsPdf
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce({
        blob: new Blob(['recovered'], { type: 'application/pdf' }),
        bytes: new Uint8Array([7]),
        pageCount: 2,
        generatedAt: 'recovered',
      })

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)
    expect(latestState?.pending).toBe(true)
    expect(latestState?.error).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()
    expect(latestState?.error).toContain('Unable to render PDF preview')

    await renderHarness(createResume('Resume Two'), theme)
    expect(latestState?.pending).toBe(true)
    expect(latestState?.error).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()
    expect(latestState?.error).toBeNull()
    expect(latestState?.previewBlobUrl).toBe('blob:preview')
  })

  it('ignores stale render completions when a newer render starts', async () => {
    const first = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()
    const second = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()

    mockedRenderResumeAsPdf
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    createObjectURLMock.mockReturnValueOnce('blob:newest')

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    await renderHarness(createResume('Resume Two'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    first.resolve({
      blob: new Blob(['old'], { type: 'application/pdf' }),
      bytes: new Uint8Array([1]),
      pageCount: 1,
      generatedAt: 'old',
    })
    await flushPromises()

    expect(createObjectURLMock).toHaveBeenCalledTimes(0)
    expect(latestState?.pending).toBe(true)

    second.resolve({
      blob: new Blob(['new'], { type: 'application/pdf' }),
      bytes: new Uint8Array([2]),
      pageCount: 3,
      generatedAt: 'new',
    })
    await flushPromises()

    expect(createObjectURLMock).toHaveBeenCalledTimes(1)
    expect(latestState?.previewBlobUrl).toBe('blob:newest')
    expect(latestState?.pageCount).toBe(3)
  })

  it('ignores stale render errors when a newer render succeeds', async () => {
    const first = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()
    const second = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()

    mockedRenderResumeAsPdf
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise)

    createObjectURLMock.mockReturnValueOnce('blob:fresh')

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    await renderHarness(createResume('Resume Two'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    second.resolve({
      blob: new Blob(['new'], { type: 'application/pdf' }),
      bytes: new Uint8Array([2]),
      pageCount: 4,
      generatedAt: 'new',
    })
    await flushPromises()

    first.reject(new Error('stale failure'))
    await flushPromises()

    expect(latestState).toMatchObject({
      previewBlobUrl: 'blob:fresh',
      pageCount: 4,
      pending: false,
      error: null,
    })
  })

  it('clears stale pdf state and revokes active blob URL when rendering fails', async () => {
    mockedRenderResumeAsPdf
      .mockResolvedValueOnce({
        blob: new Blob(['ok'], { type: 'application/pdf' }),
        bytes: new Uint8Array([1]),
        pageCount: 2,
        generatedAt: 'ok',
      })
      .mockRejectedValueOnce(new Error('render failed'))

    createObjectURLMock.mockReturnValueOnce('blob:ok')

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(latestState?.previewBlobUrl).toBe('blob:ok')

    await renderHarness(createResume('Resume Two'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:ok')
    expect(latestState).toMatchObject({
      previewBlobUrl: null,
      cachedPdfBlob: null,
      pageCount: null,
      pending: false,
    })
    expect(latestState?.error).toContain('Unable to render PDF preview')
  })

  it('does not revoke URL when rendering fails before any successful preview', async () => {
    mockedRenderResumeAsPdf.mockRejectedValueOnce(new Error('boom'))

    await renderHarness(createResume('Resume One'), createTheme())
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(revokeObjectURLMock).not.toHaveBeenCalled()
    expect(latestState?.previewBlobUrl).toBeNull()
  })

  it('clears prior debounce timers so only the latest pending input renders', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['latest'], { type: 'application/pdf' }),
      bytes: new Uint8Array([9]),
      pageCount: 2,
      generatedAt: 'latest',
    })

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    await renderHarness(createResume('Resume Two'), theme)

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    await renderHarness(createResume('Resume Three'), theme)

    await act(async () => {
      vi.advanceTimersByTime(399)
    })
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(0)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
    expect(mockedRenderResumeAsPdf).toHaveBeenLastCalledWith(createResume('Resume Three'), theme)
  })

  it('respects custom debounceMs values', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['custom'], { type: 'application/pdf' }),
      bytes: new Uint8Array([5]),
      pageCount: 1,
      generatedAt: 'custom',
    })

    await renderHarness(createResume('Debounced Resume'), createTheme(), 100)

    await act(async () => {
      vi.advanceTimersByTime(99)
    })
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(0)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
  })

  it('revokes prior blob URLs on successive successful renders', async () => {
    mockedRenderResumeAsPdf
      .mockResolvedValueOnce({
        blob: new Blob(['one'], { type: 'application/pdf' }),
        bytes: new Uint8Array([1]),
        pageCount: 1,
        generatedAt: 'one',
      })
      .mockResolvedValueOnce({
        blob: new Blob(['two'], { type: 'application/pdf' }),
        bytes: new Uint8Array([2]),
        pageCount: 2,
        generatedAt: 'two',
      })

    createObjectURLMock.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')

    const theme = createTheme()
    await renderHarness(createResume('Resume One'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    await renderHarness(createResume('Resume Two'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:first')
    expect(latestState?.previewBlobUrl).toBe('blob:second')
  })

  it('re-renders when theme changes even if resume stays the same', async () => {
    mockedRenderResumeAsPdf
      .mockResolvedValueOnce({
        blob: new Blob(['one'], { type: 'application/pdf' }),
        bytes: new Uint8Array([1]),
        pageCount: 1,
        generatedAt: 'one',
      })
      .mockResolvedValueOnce({
        blob: new Blob(['two'], { type: 'application/pdf' }),
        bytes: new Uint8Array([2]),
        pageCount: 2,
        generatedAt: 'two',
      })

    const resume = createResume('Same Resume')
    const firstTheme = createTheme()
    const secondTheme = {
      ...createTheme(),
      fontHeading: 'DM Sans',
    }

    await renderHarness(resume, firstTheme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    await renderHarness(resume, secondTheme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(2)
    expect(mockedRenderResumeAsPdf).toHaveBeenLastCalledWith(resume, secondTheme)
  })

  it('revokes the active blob URL when unmounted', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      bytes: new Uint8Array([1]),
      pageCount: 1,
      generatedAt: 'x',
    })
    createObjectURLMock.mockReturnValueOnce('blob:active')

    await renderHarness(createResume('Resume One'), createTheme())
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    await act(async () => {
      root?.unmount()
    })
    root = null

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:active')
  })

  it('cancels pending debounce timers on unmount before rendering starts', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['unused'], { type: 'application/pdf' }),
      bytes: new Uint8Array([1]),
      pageCount: 1,
      generatedAt: 'unused',
    })

    await renderHarness(createResume('Unmount Early'), createTheme())
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    await act(async () => {
      root?.unmount()
    })
    root = null

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).not.toHaveBeenCalled()
  })

  it('ignores in-flight completion after unmount once render has started', async () => {
    const inFlight = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()
    mockedRenderResumeAsPdf.mockImplementationOnce(() => inFlight.promise)

    await renderHarness(createResume('Unmount Mid Render'), createTheme())
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    await act(async () => {
      root?.unmount()
    })
    root = null

    inFlight.resolve({
      blob: new Blob(['late'], { type: 'application/pdf' }),
      bytes: new Uint8Array([6]),
      pageCount: 1,
      generatedAt: 'late',
    })
    await flushPromises()

    expect(createObjectURLMock).not.toHaveBeenCalled()
    expect(revokeObjectURLMock).not.toHaveBeenCalled()
  })

  it('ignores in-flight failures after unmount once render has started', async () => {
    const inFlight = makeDeferred<Awaited<ReturnType<typeof renderResumeAsPdf>>>()
    mockedRenderResumeAsPdf.mockImplementationOnce(() => inFlight.promise)

    await renderHarness(createResume('Unmount Mid Error'), createTheme())
    await act(async () => {
      vi.advanceTimersByTime(400)
    })

    await act(async () => {
      root?.unmount()
    })
    root = null

    inFlight.reject(new Error('late failure'))
    await flushPromises()

    expect(createObjectURLMock).not.toHaveBeenCalled()
    expect(revokeObjectURLMock).not.toHaveBeenCalled()
  })

  it('restarts debounce when debounceMs changes', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['updated'], { type: 'application/pdf' }),
      bytes: new Uint8Array([4]),
      pageCount: 1,
      generatedAt: 'updated',
    })

    const resume = createResume('Debounce Switch')
    const theme = createTheme()
    await renderHarness(resume, theme, 400)

    await act(async () => {
      vi.advanceTimersByTime(200)
    })
    await renderHarness(resume, theme, 100)

    await act(async () => {
      vi.advanceTimersByTime(99)
    })
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(0)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    await flushPromises()
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
  })

  it('supports zero debounce boundaries', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['immediate'], { type: 'application/pdf' }),
      bytes: new Uint8Array([5]),
      pageCount: 1,
      generatedAt: 'immediate',
    })

    await renderHarness(createResume('Immediate'), createTheme(), 0)
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    await flushPromises()

    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
  })

  it('uses hook default debounce when debounceMs is omitted', async () => {
    mockedRenderResumeAsPdf.mockResolvedValue({
      blob: new Blob(['default'], { type: 'application/pdf' }),
      bytes: new Uint8Array([8]),
      pageCount: 1,
      generatedAt: 'default',
    })

    await renderHarness(createResume('Default Debounce'), createTheme())

    await act(async () => {
      vi.advanceTimersByTime(399)
    })
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(0)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    await flushPromises()
    expect(mockedRenderResumeAsPdf).toHaveBeenCalledTimes(1)
  })

  it('preserves clean error behavior across consecutive failures', async () => {
    mockedRenderResumeAsPdf
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))

    const theme = createTheme()
    await renderHarness(createResume('Failure One'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(latestState?.error).toContain('Unable to render PDF preview')
    expect(revokeObjectURLMock).not.toHaveBeenCalled()

    await renderHarness(createResume('Failure Two'), theme)
    await act(async () => {
      vi.advanceTimersByTime(400)
    })
    await flushPromises()

    expect(latestState?.error).toContain('Unable to render PDF preview')
    expect(latestState?.previewBlobUrl).toBeNull()
    expect(revokeObjectURLMock).not.toHaveBeenCalled()
  })
})
