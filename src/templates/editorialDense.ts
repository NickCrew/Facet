import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
  convertInchesToTwip,
} from 'docx'
import type { ResumeTemplate, TemplateResumeData } from './types'

const BODY_FONT = 'Georgia'
const HEADING_FONT = 'Arial'

const sectionHeading = (label: string): Paragraph =>
  new Paragraph({
    spacing: {
      before: 180,
      after: 100,
    },
    border: {
      bottom: {
        color: 'A3A3A3',
        size: 6,
        style: BorderStyle.SINGLE,
      },
    },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        font: HEADING_FONT,
        bold: true,
        size: 18,
      }),
    ],
  })

const roleHeading = (company: string, title: string, dates: string): Paragraph =>
  new Paragraph({
    spacing: { before: 120, after: 40 },
    children: [
      new TextRun({ text: `${company} | ${title}`, bold: true, font: BODY_FONT, size: 22 }),
      new TextRun({ text: `  (${dates})`, italics: true, font: BODY_FONT, size: 22 }),
    ],
  })

const profileParagraph = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: BODY_FONT, size: 22 })],
  })

const bulletParagraph = (text: string): Paragraph =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font: BODY_FONT, size: 22 })],
  })

const buildHeaderLines = (resume: TemplateResumeData): Paragraph[] => {
  const contactParts = [
    resume.header.location,
    resume.header.email,
    resume.header.phone,
    ...resume.header.links.map((link) => `${link.label}: ${link.url}`),
  ].filter((part) => part.trim().length > 0)

  const lines: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: resume.header.name,
          bold: true,
          font: HEADING_FONT,
          size: 34,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 90 },
      children: [new TextRun({ text: contactParts.join(' | '), font: BODY_FONT, size: 21 })],
    }),
  ]

  if (resume.targetLine) {
    lines.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: resume.targetLine,
            bold: true,
            font: BODY_FONT,
            size: 22,
          }),
        ],
      }),
    )
  }

  return lines
}

const buildBodyParagraphs = (resume: TemplateResumeData): Paragraph[] => {
  const paragraphs: Paragraph[] = [...buildHeaderLines(resume)]

  if (resume.profile.trim().length > 0) {
    paragraphs.push(sectionHeading('Profile'))
    paragraphs.push(profileParagraph(resume.profile))
  }

  if (resume.skillGroups.length > 0) {
    paragraphs.push(sectionHeading('Skills'))
    for (const skillGroup of resume.skillGroups) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${skillGroup.label}: `, bold: true, font: BODY_FONT, size: 22 }),
            new TextRun({ text: skillGroup.content, font: BODY_FONT, size: 22 }),
          ],
        }),
      )
    }
  }

  if (resume.roles.length > 0) {
    paragraphs.push(sectionHeading('Experience'))
    for (const role of resume.roles) {
      paragraphs.push(roleHeading(role.company, role.title, role.dates))
      if (role.subtitle) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: role.subtitle, italics: true, font: BODY_FONT, size: 21 })],
          }),
        )
      }

      for (const bullet of role.bullets) {
        paragraphs.push(bulletParagraph(bullet))
      }
    }
  }

  if (resume.projects.length > 0) {
    paragraphs.push(sectionHeading('Projects'))
    for (const project of resume.projects) {
      const headline = project.url ? `${project.name} (${project.url})` : project.name
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${headline}: `, bold: true, font: BODY_FONT, size: 22 }),
            new TextRun({ text: project.text, font: BODY_FONT, size: 22 }),
          ],
        }),
      )
    }
  }

  if (resume.education.length > 0) {
    paragraphs.push(sectionHeading('Education'))
    for (const entry of resume.education) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${entry.school}, ${entry.location} — `, bold: true, font: BODY_FONT, size: 22 }),
            new TextRun({ text: `${entry.degree} (${entry.year})`, font: BODY_FONT, size: 22 }),
          ],
        }),
      )
    }
  }

  return paragraphs
}

export const renderEditorialDenseDocx = async (resume: TemplateResumeData): Promise<Blob> => {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: BODY_FONT,
            size: 22,
          },
          paragraph: {
            spacing: {
              line: 280,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.55),
              right: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(0.55),
              left: convertInchesToTwip(0.6),
            },
          },
        },
        children: buildBodyParagraphs(resume),
      },
    ],
  })

  return Packer.toBlob(doc)
}

export const editorialDenseTemplate: ResumeTemplate<Blob> = {
  id: 'editorial-dense',
  label: 'Editorial Dense',
  render: renderEditorialDenseDocx,
}
