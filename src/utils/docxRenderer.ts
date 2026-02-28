import type { AssembledResume } from '../types'
import { renderEditorialDenseDocx } from '../templates/editorialDense'
import { toTemplateResumeData } from '../templates/types'

const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export const renderResumeAsDocx = async (resume: AssembledResume): Promise<Blob> =>
  renderEditorialDenseDocx(toTemplateResumeData(resume))

export const renderResumeAsDocxFile = async (
  resume: AssembledResume,
  fileName = 'resume.docx',
): Promise<File> => {
  const blob = await renderResumeAsDocx(resume)
  return new File([blob], fileName, { type: DOCX_MIME_TYPE })
}
