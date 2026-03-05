import { useMemo, type CSSProperties } from 'react'
import type { AssembledResume, ResumeTheme } from '../types'
import { toLinkDisplayText, toLinkHref } from '../utils/linkFormatting'
import { pointsToPixels, inchesToPixels, toHexColor, US_LETTER_HEIGHT_PX } from '../utils/unitConversions'

interface LivePreviewProps {
  assembled: AssembledResume
  theme: ResumeTheme
  showHeatmap?: boolean
}

// eslint-disable-next-line react-refresh/only-export-components -- used by tests
export const buildPreviewVars = (theme: ResumeTheme): CSSProperties => {
  /**
   * Sync leading with Typst:
   * Typst: leading = if lineHeight <= 1 { 0pt } else { (lineHeight - 1) * sizeBody }
   * CSS: line-height = (sizeBody + leading) / sizeBody
   *
   * Note: Sub-1 lineHeight values floor to 1.0 (leading 0pt) to match Typst template logic.
   */
  const leading = theme.lineHeight <= 1 ? 0 : (theme.lineHeight - 1) * theme.sizeBody
  const cssLineHeight = (theme.sizeBody + leading) / theme.sizeBody

  return {
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
    '--preview-line-height': cssLineHeight.toFixed(3),
    '--preview-bullet-gap': pointsToPixels(theme.bulletGap),
    '--preview-section-gap-before': pointsToPixels(theme.sectionGapBefore),
    '--preview-section-gap-after': pointsToPixels(theme.sectionGapAfter),
    '--preview-section-rule-gap': pointsToPixels(theme.sectionRuleGap),
    '--preview-role-gap': pointsToPixels(theme.roleGap),
    '--preview-role-header-gap': pointsToPixels(theme.roleHeaderGap),
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

    // Template-specific tokens
    '--preview-sidebar-width': theme.sidebarWidth ? inchesToPixels(theme.sidebarWidth) : '2.2in',
    '--preview-sidebar-color': theme.sidebarColor ? toHexColor(theme.sidebarColor) : '#f8f9fa',
    '--preview-column-gap': theme.columnGap ? pointsToPixels(theme.columnGap) : '24px',
  } as CSSProperties
}

export function LivePreview({ assembled, theme, showHeatmap }: LivePreviewProps) {
  const previewStyle = useMemo(() => buildPreviewVars(theme), [theme])
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

  const renderContent = () => {
    return (
      <>
        {assembled.targetLine ? (
          <p className="target-line">{assembled.targetLine.text}</p>
        ) : null}

        {assembled.profile ? (
          <section className="resume-section">
            <p className="profile-text">{assembled.profile.text}</p>
          </section>
        ) : null}

        {assembled.skillGroups.length > 0 && theme.templateId !== 'sidebar' ? (
          <section className="resume-section">
            <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'SKILLS')}</h2>
            <div className="skills-grid">
              {assembled.skillGroups.map((group) => (
                <div key={group.id} className="skill-group">
                  <strong>{group.label}:</strong> {group.content}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {assembled.roles.length > 0 ? (
          <section className="resume-section">
            <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'EXPERIENCE')}</h2>
            {assembled.roles.map((role) => (
              <div key={role.id} className="role-entry">
                <div className="role-header">
                  <div className="role-header-main">
                    <span className="company-name">{role.company}</span>
                    {role.dates && (
                      <span className="role-dates">{role.dates}</span>
                    )}
                  </div>
                  <div className="role-header-sub">
                    <span className="role-title">{role.title}</span>
                    {role.location && (
                      <span className="role-location">{role.location}</span>
                    )}
                  </div>
                </div>
                {role.subtitle && <p className="role-subtitle">{role.subtitle}</p>}
                <ul className={`bullet-list ${isNoBulletTheme ? 'no-bullets' : ''}`}>
                  {role.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null}

        {assembled.projects.length > 0 ? (
          <section className="resume-section">
            <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'PROJECTS')}</h2>
            {assembled.projects.map((project) => (
              <div key={project.id} className="project-entry">
                <div className="project-header">
                  <span className="project-name">{project.name}</span>
                  {project.url && (
                    <span className="project-url">({project.url})</span>
                  )}
                </div>
                <p className="project-text">{project.text}</p>
              </div>
            ))}
          </section>
        ) : null}

        {assembled.education.length > 0 && theme.templateId !== 'sidebar' ? (
          <section className="resume-section">
            <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'EDUCATION')}</h2>
            <ul className="education-list">
              {assembled.education.map((item) => (
                <li key={`${item.school}-${item.degree}`} className="education-row">
                  <strong>{item.school}</strong>, {item.location} - {item.degree}{item.year ? ` (${item.year})` : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </>
    )
  }

  if (theme.templateId === 'sidebar') {
    return (
      <div
        className={`preview-shell section-style-${theme.sectionHeaderStyle} dates-alignment-${
          theme.datesAlignment
        } template-sidebar ${showHeatmap ? 'show-heatmap' : ''}`}
        style={previewStyle}
      >
        <div className="preview-paper sidebar-layout">
          <aside className="preview-sidebar">
            <header className="resume-header">
              <h1>{assembled.header.name}</h1>
              <div className="resume-contact-block">
                {contactParts.map((part, idx) => (
                  <p key={idx} className="resume-contact">{part}</p>
                ))}
                {linkParts.map((link) => (
                  <p key={link.href} className="resume-contact">
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.text}
                    </a>
                  </p>
                ))}
              </div>
            </header>

            {assembled.skillGroups.length > 0 && (
              <section className="resume-section">
                <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'SKILLS')}</h2>
                <div className="skills-sidebar">
                  {assembled.skillGroups.map((group) => (
                    <div key={group.id} className="skill-group">
                      <strong>{group.label}:</strong> {group.content}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {assembled.education.length > 0 && (
              <section className="resume-section">
                <h2>{formatSectionLabel(theme.sectionHeaderStyle, 'EDUCATION')}</h2>
                <ul className="education-list-sidebar">
                  {assembled.education.map((item) => (
                    <li key={`${item.school}-${item.degree}`} className="education-row">
                      <strong>{item.school}</strong><br />
                      {item.degree}{item.year ? ` (${item.year})` : ''}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
          <main className="preview-main">
            {renderContent()}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`preview-shell section-style-${theme.sectionHeaderStyle} dates-alignment-${
        theme.datesAlignment
      } template-${theme.templateId} ${showHeatmap ? 'show-heatmap' : ''}`}
      style={previewStyle}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="preview-page-guide"
          style={{ top: `calc(var(--space-6) + ${US_LETTER_HEIGHT_PX * (i + 1)}px)` }}
          data-page={i + 2}
          aria-hidden="true"
        />
      ))}
      <article className="preview-paper">
        <header className="resume-header">
          <h1>{assembled.header.name}</h1>
          <div className="resume-contact-block">
            {contactParts.length ? <p className="resume-contact">{contactParts.join(' | ')}</p> : null}
            {linkParts.length ? (
              <p className="resume-contact">
                {linkParts.map((link, idx) => (
                  <span key={link.href}>
                    {idx > 0 ? ' | ' : ''}
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.text}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        </header>
        {renderContent()}
      </article>
    </div>
  )
}

function formatSectionLabel(style: ResumeTheme['sectionHeaderStyle'], defaultLabel: string): string {
  if (style === 'caps-rule') {
    return defaultLabel.toUpperCase()
  }
  return defaultLabel.charAt(0).toUpperCase() + defaultLabel.slice(1).toLowerCase()
}
