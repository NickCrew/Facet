import { getTypstSnippet, toPdfPageCount } from '../utils/typstRendererUtils'
import type { TypstWorkerRequest, TypstWorkerResponse } from '../utils/typstRenderer.types'

self.onmessage = async (event: MessageEvent<TypstWorkerRequest>) => {
  const { id, fontFiles, dataPayload, themePayload, templateContent } = event.data

  try {
    if (!templateContent) {
      throw new Error(`Missing templateContent in worker message (id: ${id})`)
    }
    const snippet = await getTypstSnippet(fontFiles)
    
    const pdfBytes = await snippet.pdf({
      mainContent: templateContent,
      inputs: {
        data: JSON.stringify(dataPayload),
        theme: JSON.stringify(themePayload),
      },
    })

    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('Typst renderer produced an empty PDF output.')
    }

    const bytes = new Uint8Array(pdfBytes)
    
    const response: TypstWorkerResponse = {
      id,
      type: 'success',
      bytes,
      pageCount: toPdfPageCount(bytes),
    }

    // Transfer the bytes to the main thread for performance
    ;(self as unknown as Worker).postMessage(response, [bytes.buffer])
  } catch (error) {
    const response: TypstWorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    }
    ;(self as unknown as Worker).postMessage(response)
  }
}
