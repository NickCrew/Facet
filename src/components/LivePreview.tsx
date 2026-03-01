import type { CSSProperties } from 'react'
import type { AssembledResume, ResumeTheme } from '../types'
import { toLinkDisplayText, toLinkHref } from '../utils/linkFormatting'

interface LivePreviewProps {
  assembled: AssembledResume
  theme: ResumeTheme
}

const pointsToPixels = (value: number): string => `${(value * 1.333).toFixed(2)}px`
const inchesToPixels = (value: number): string => `${(value * 96).toFixed(2)}px`
const toHexColor = (value: string): string => (value.startsWith('#') ? value : `#${value}`)

const buildPreviewVars = (theme: ResumeTheme): CSSProperties =>
  ({
    '--preview-font-body': theme.fontBody,
    '--preview-font-heading': theme.fontHeading,
    '--preview-size-body': pointsToPixels(theme.sizeBody),
    '--preview-size-name': pointsToPixels(theme.sizeName),
    '--preview-size-section': pointsToPixels(theme.sizeSectionHeader),
    '--preview-size-role-title': pointsToPixels(theme.sizeRoleTitle),
    '--preview-size-company': pointsToPixels(theme.sizeCompanyName),
    '--preview-size-small': pointsToPixels(theme.sizeSmall),
    '--preview-size-contact': pointsToPixels(theme.sizeContact),
    '--preview-size-project-url': pointsToPixels(theme.projectUrlSize),
    '--preview-line-height': theme.lineHeight.toString(),
    '--preview-bullet-gap': pointsToPixels(theme.bulletGap),
    '--preview-section-gap-before': pointsToPixels(theme.sectionGapBefore),
    '--preview-section-gap-after': pointsToPixels(theme.sectionGapAfter),
    '--preview-role-gap': pointsToPixels(theme.roleGap),
    '--preview-role-line-gap-after': pointsToPixels(theme.roleLineGapAfter),
    '--preview-paragraph-gap': pointsToPixels(theme.paragraphGap),
    '--preview-contact-gap-after': pointsToPixels(theme.contactGapAfter),
    '--preview-competency-gap': pointsToPixels(theme.competencyGap),
    '--preview-project-gap': pointsToPixels(theme.projectGap),
    '--preview-margin-top': inchesToPixels(theme.marginTop),
    '--preview-margin-bottom': inchesToPixels(theme.marginBottom),
    '--preview-margin-left': inchesToPixels(theme.marginLeft),
    '--preview-margin-right': inchesToPixels(theme.marginRight),
    '--preview-color-body': toHexColor(theme.colorBody),
    '--preview-color-heading': toHexColor(theme.colorHeading),
    '--preview-color-section': toHexColor(theme.colorSection),
    '--preview-color-dim': toHexColor(theme.colorDim),
    '--preview-color-rule': toHexColor(theme.colorRule),
    '--preview-color-role-title': toHexColor(theme.roleTitleColor),
    '--preview-color-dates': toHexColor(theme.datesColor),
    '--preview-color-subtitle': toHexColor(theme.subtitleColor),
    '--preview-color-competency-label': toHexColor(theme.competencyLabelColor),
    '--preview-color-project-url': toHexColor(theme.projectUrlColor),
    '--preview-letter-spacing': pointsToPixels(theme.sectionHeaderLetterSpacing),
    '--preview-name-letter-spacing': pointsToPixels(theme.nameLetterSpacing),
    '--preview-rule-weight': pointsToPixels(theme.sectionRuleWeight),
    '--preview-bullet-indent': pointsToPixels(theme.bulletIndent),
    '--preview-bullet-hanging': pointsToPixels(theme.bulletHanging),
    '--preview-bullet-char': theme.bulletChar === 'none' ? '""' : `"${theme.bulletChar}"`,
    '--preview-name-weight': theme.nameBold ? '700' : '400',
    '--preview-name-align': theme.nameAlignment,
    '--preview-contact-align': theme.contactAlignment,
    '--preview-company-weight': theme.companyBold ? '700' : '400',
    '--preview-role-title-style': theme.roleTitleItalic ? 'italic' : 'normal',
    '--preview-subtitle-style': theme.subtitleItalic ? 'italic' : 'normal',
    '--preview-competency-label-weight': theme.competencyLabelBold ? '700' : '400',
    '--preview-project-name-weight': theme.projectNameBold ? '700' : '400',
    '--preview-education-school-weight': theme.educationSchoolBold ? '700' : '400',
  }) as CSSProperties

export function LivePreview({ assembled, theme }: LivePreviewProps) {
  const previewStyle = buildPreviewVars(theme)
  const isNoBulletTheme = theme.bulletChar === 'none'

  const contactParts = [assembled.header.email, assembled.header.phone, assembled.header.location]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
  const linkParts = assembled.header.links
    .map((link) => ({
      href: toLinkHref(link.url),
      text: toLinkDisplayText(link),
    }))
    .filter((link) => link.href.length > 0 && link.text.length > 0)

  return (
    <div
      className={`preview-shell section-style-${theme.sectionHeaderStyle} dates-alignment-${theme.datesAlignment}`}
      style={previewStyle}
    >
      <article className="preview-paper">
        <header className="resume-header">
          <h1>{assembled.header.name}</h1>
          <div className="resume-contact-block">
            {contactParts.length ? <p className="resume-contact">{contactParts.join(' | ')}</p> : null}
            {linkParts.length ? (
              <p className="resume-contact">
                {linkParts.map((link, index) => (
                  <span key={`${link.href}-${index}`}>
                    {index > 0 ? ' | ' : null}
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.text}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
          {assembled.targetLine ? <p className="target-line">{assembled.targetLine.text}</p> : null}
        </header>

        {assembled.profile ? (
          <section>
            <h2>Profile</h2>
            <p>{assembled.profile.text}</p>
          </section>
        ) : null}

        {assembled.skillGroups.length ? (
          <section>
            <h2>Skills</h2>
            <ul className="plain-list">
              {assembled.skillGroups.map((skillGroup) => (
                <li key={skillGroup.label} className="preview-competency-row">
                  <strong>{skillGroup.label}: </strong>
                  {skillGroup.content}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {assembled.roles.length ? (
          <section>
            <h2>Experience</h2>
            <div className="role-preview-list">
              {assembled.roles.map((role) => (
                <article key={`${role.company}-${role.title}-${role.dates}`}>
                  <header className="role-preview-header">
                    <div className="role-company-line">
                      <strong>{role.company}</strong>
                      {role.dates.trim().length > 0 ? <span>{role.dates}</span> : null}
                    </div>
                    <p className="role-title-line">{role.title}</p>
                  </header>
                  {role.subtitle ? <p className="role-subtitle-line">{role.subtitle}</p> : null}
                  <ul className={isNoBulletTheme ? 'plain-list no-bullets' : 'preview-bullet-list'}>
                    {role.bullets.map((bullet, index) => (
                      <li key={`${role.company}-bullet-${index}`} className="preview-bullet-item">
                        {bullet.text}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {assembled.projects.length ? (
          <section>
            <h2>Projects</h2>
            <ul className="plain-list">
              {assembled.projects.map((project) => (
                <li key={project.name} className="project-preview-row">
                  <strong>{project.name}</strong>
                  {project.url ? <span className="project-preview-url"> ({project.url})</span> : null}
                  <span>: {project.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {assembled.education.length ? (
          <section>
            <h2>Education</h2>
            <ul className="plain-list">
              {assembled.education.map((item) => (
                <li key={`${item.school}-${item.year}`} className="education-preview-row">
                  <strong>{item.school}</strong>, {item.location} - {item.degree} ({item.year})
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </div>
  )
}
