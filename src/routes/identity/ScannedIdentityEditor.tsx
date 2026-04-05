import type { ProfessionalIdentityV3 } from '../../identity/schema'
import type { ResumeScanResult } from '../../types/identity'

interface ScannedIdentityEditorProps {
  scanResult: ResumeScanResult
  onUpdateIdentityCore: (
    field: keyof ProfessionalIdentityV3['identity'],
    value: string | boolean | ProfessionalIdentityV3['identity']['links'],
  ) => void
  onUpdateRole: (
    roleIndex: number,
    field: 'company' | 'title' | 'dates' | 'subtitle',
    value: string,
  ) => void
  onUpdateBulletSourceText: (roleIndex: number, bulletIndex: number, value: string) => void
  onUpdateSkillGroupLabel: (groupIndex: number, value: string) => void
  onUpdateSkillItemName: (groupIndex: number, itemIndex: number, value: string) => void
  onUpdateEducationEntry: (
    educationIndex: number,
    field: keyof ProfessionalIdentityV3['education'][number],
    value: string,
  ) => void
}

const linksToDocument = (links: ProfessionalIdentityV3['identity']['links']): string =>
  links.map((link) => `${link.id} | ${link.url}`).join('\n')

const parseLinksDocument = (value: string): ProfessionalIdentityV3['identity']['links'] =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [id, ...rest] = line.split('|')
      return {
        id: id.trim() || `link-${index + 1}`,
        url: rest.join('|').trim(),
      }
    })
    .filter((entry) => entry.url)

export function ScannedIdentityEditor({
  scanResult,
  onUpdateIdentityCore,
  onUpdateRole,
  onUpdateBulletSourceText,
  onUpdateSkillGroupLabel,
  onUpdateSkillItemName,
  onUpdateEducationEntry,
}: ScannedIdentityEditorProps) {
  const { identity } = scanResult

  return (
    <div className="identity-scan-editor">
      <section className="identity-scan-section">
        <div>
          <h3>Contact</h3>
          <p>Review the header fields before deepening the scanned structure.</p>
        </div>
        <div className="identity-scan-form-grid">
          <label className="identity-field">
            <span className="identity-label">Name</span>
            <input
              className="identity-input"
              value={identity.identity.name}
              onChange={(event) => onUpdateIdentityCore('name', event.target.value)}
            />
          </label>
          <label className="identity-field">
            <span className="identity-label">Title</span>
            <input
              className="identity-input"
              value={identity.identity.title ?? ''}
              onChange={(event) => onUpdateIdentityCore('title', event.target.value)}
            />
          </label>
          <label className="identity-field">
            <span className="identity-label">Email</span>
            <input
              className="identity-input"
              value={identity.identity.email}
              onChange={(event) => onUpdateIdentityCore('email', event.target.value)}
            />
          </label>
          <label className="identity-field">
            <span className="identity-label">Phone</span>
            <input
              className="identity-input"
              value={identity.identity.phone}
              onChange={(event) => onUpdateIdentityCore('phone', event.target.value)}
            />
          </label>
          <label className="identity-field">
            <span className="identity-label">Location</span>
            <input
              className="identity-input"
              value={identity.identity.location}
              onChange={(event) => onUpdateIdentityCore('location', event.target.value)}
            />
          </label>
          <label className="identity-field identity-field-wide">
            <span className="identity-label">Links</span>
            <textarea
              className="identity-textarea"
              value={linksToDocument(identity.identity.links)}
              onChange={(event) => onUpdateIdentityCore('links', parseLinksDocument(event.target.value))}
              placeholder="github | https://github.com/you"
            />
          </label>
          <label className="identity-field identity-field-wide">
            <span className="identity-label">Summary / Thesis</span>
            <textarea
              className="identity-textarea"
              value={identity.identity.thesis}
              onChange={(event) => onUpdateIdentityCore('thesis', event.target.value)}
              placeholder="Short summary extracted from the resume."
            />
          </label>
        </div>
      </section>

      <section className="identity-scan-section">
        <div>
          <h3>Roles</h3>
          <p>These bullets stay as source text until the extraction agent decomposes them.</p>
        </div>
        {identity.roles.length > 0 ? (
          <div className="identity-scan-stack">
            {identity.roles.map((role, roleIndex) => (
              <article className="identity-scan-card" key={role.id}>
                <div className="identity-scan-form-grid">
                  <label className="identity-field">
                    <span className="identity-label">Company</span>
                    <input
                      className="identity-input"
                      value={role.company}
                      onChange={(event) => onUpdateRole(roleIndex, 'company', event.target.value)}
                    />
                  </label>
                  <label className="identity-field">
                    <span className="identity-label">Title</span>
                    <input
                      className="identity-input"
                      value={role.title}
                      onChange={(event) => onUpdateRole(roleIndex, 'title', event.target.value)}
                    />
                  </label>
                  <label className="identity-field">
                    <span className="identity-label">Dates</span>
                    <input
                      className="identity-input"
                      value={role.dates}
                      onChange={(event) => onUpdateRole(roleIndex, 'dates', event.target.value)}
                    />
                  </label>
                  <label className="identity-field identity-field-wide">
                    <span className="identity-label">Subtitle</span>
                    <input
                      className="identity-input"
                      value={role.subtitle ?? ''}
                      onChange={(event) => onUpdateRole(roleIndex, 'subtitle', event.target.value)}
                    />
                  </label>
                </div>
                <div className="identity-scan-stack">
                  {role.bullets.map((bullet, bulletIndex) => (
                    <label className="identity-field" key={bullet.id}>
                      <span className="identity-label">Bullet {bulletIndex + 1}</span>
                      <textarea
                        className="identity-textarea"
                        value={bullet.source_text ?? ''}
                        onChange={(event) =>
                          onUpdateBulletSourceText(roleIndex, bulletIndex, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="identity-muted">No roles were parsed from this PDF.</p>
        )}
      </section>

      <section className="identity-scan-section">
        <div>
          <h3>Skills</h3>
          <p>Skill groups can be renamed inline before AI deepening.</p>
        </div>
        {identity.skills.groups.length > 0 ? (
          <div className="identity-scan-stack">
            {identity.skills.groups.map((group, groupIndex) => (
              <article className="identity-scan-card" key={group.id}>
                <label className="identity-field">
                  <span className="identity-label">Group Label</span>
                  <input
                    className="identity-input"
                    value={group.label}
                    onChange={(event) => onUpdateSkillGroupLabel(groupIndex, event.target.value)}
                  />
                </label>
                <div className="identity-scan-stack">
                  {group.items.map((item, itemIndex) => (
                    <label className="identity-field" key={group.id + ':' + itemIndex}>
                      <span className="identity-label">Skill {itemIndex + 1}</span>
                      <input
                        className="identity-input"
                        value={item.name}
                        onChange={(event) =>
                          onUpdateSkillItemName(groupIndex, itemIndex, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="identity-muted">No skill groups were parsed from this PDF.</p>
        )}
      </section>

      <section className="identity-scan-section">
        <div>
          <h3>Education</h3>
          <p>Education entries stay lightweight in v1 and can be refined later.</p>
        </div>
        {identity.education.length > 0 ? (
          <div className="identity-scan-stack">
            {identity.education.map((entry, educationIndex) => (
              <article className="identity-scan-card" key={`${entry.school}-${educationIndex}`}>
                <div className="identity-scan-form-grid">
                  <label className="identity-field">
                    <span className="identity-label">School</span>
                    <input
                      className="identity-input"
                      value={entry.school}
                      onChange={(event) =>
                        onUpdateEducationEntry(educationIndex, 'school', event.target.value)
                      }
                    />
                  </label>
                  <label className="identity-field">
                    <span className="identity-label">Degree</span>
                    <input
                      className="identity-input"
                      value={entry.degree}
                      onChange={(event) =>
                        onUpdateEducationEntry(educationIndex, 'degree', event.target.value)
                      }
                    />
                  </label>
                  <label className="identity-field">
                    <span className="identity-label">Location</span>
                    <input
                      className="identity-input"
                      value={entry.location}
                      onChange={(event) =>
                        onUpdateEducationEntry(educationIndex, 'location', event.target.value)
                      }
                    />
                  </label>
                  <label className="identity-field">
                    <span className="identity-label">Year</span>
                    <input
                      className="identity-input"
                      value={entry.year ?? ''}
                      onChange={(event) =>
                        onUpdateEducationEntry(educationIndex, 'year', event.target.value)
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="identity-muted">No education entries were parsed from this PDF.</p>
        )}
      </section>
    </div>
  )
}
