import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useCoverLetterStore } from '../../store/coverLetterStore'
import { useResumeStore } from '../../store/resumeStore'
import type { CoverLetterParagraph } from '../../types/coverLetter'
import { createId } from '../../utils/idUtils'
import { VectorPriorityEditor } from '../../components/VectorPriorityEditor'
import './letters.css'

export function LettersPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useCoverLetterStore()
  const { data: { vectors } } = useResumeStore()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  
  const activeTemplateId = selectedTemplateId ?? templates[0]?.id ?? null
  const activeTemplate = templates.find(t => t.id === activeTemplateId)

  const handleCreateTemplate = () => {
    const id = createId('clt')
    const newTemplate = {
      id,
      name: 'New Template',
      header: `Your Name\nAddress\nEmail`,
      greeting: 'Dear Hiring Manager,',
      paragraphs: [
        {
          id: createId('clp'),
          text: 'I am writing to express my interest in...',
          vectors: {}
        }
      ],
      signOff: `Sincerely,\nYour Name`
    }
    addTemplate(newTemplate)
    setSelectedTemplateId(id)
  }

  const updateParagraph = (paragraphId: string, patch: Partial<CoverLetterParagraph>) => {
    if (!activeTemplate) return
    const newPars = activeTemplate.paragraphs.map(p => 
      p.id === paragraphId ? { ...p, ...patch } : p
    )
    updateTemplate(activeTemplate.id, { paragraphs: newPars })
  }

  const removeParagraph = (paragraphId: string) => {
    if (!activeTemplate) return
    const newPars = activeTemplate.paragraphs.filter(p => p.id !== paragraphId)
    updateTemplate(activeTemplate.id, { paragraphs: newPars })
  }

  const handleDeleteTemplate = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the template "${name}"?`)) {
      deleteTemplate(id)
      if (activeTemplateId === id) {
        setSelectedTemplateId(templates.find(t => t.id !== id)?.id ?? null)
      }
    }
  }

  return (
    <div className="letters-page">
      <nav className="letters-sidebar" aria-label="Template list">
        <div className="letters-sidebar-header">
          <h2>Templates</h2>
          <button 
            className="letters-btn-icon" 
            onClick={handleCreateTemplate} 
            title="New Template"
            aria-label="Create New Template"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="letters-template-list">
          {templates.map(t => (
            <div key={t.id} className="letters-template-list-item">
              <button 
                className={`letters-template-item ${activeTemplateId === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplateId(t.id)}
              >
                {t.name}
              </button>
              <button 
                className="letters-btn-icon letters-text-danger" 
                onClick={() => handleDeleteTemplate(t.id, t.name)}
                aria-label={`Delete ${t.name}`}
                title={`Delete ${t.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {templates.length === 0 && (
            <p className="letters-empty-text">No templates yet.</p>
          )}
        </div>
      </nav>
      
      <div className="letters-main">
        {activeTemplate ? (
          <div className="letters-editor">
            <input 
              className="letters-title-input" 
              value={activeTemplate.name}
              onChange={(e) => updateTemplate(activeTemplate.id, { name: e.target.value })}
              placeholder="Template Name"
              aria-label="Template Name"
            />
            
            <div className="letters-field">
              <label htmlFor="cl-header">Header</label>
              <textarea 
                id="cl-header"
                value={activeTemplate.header} 
                onChange={(e) => updateTemplate(activeTemplate.id, { header: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="letters-field">
              <label htmlFor="cl-greeting">Greeting</label>
              <input 
                id="cl-greeting"
                value={activeTemplate.greeting} 
                onChange={(e) => updateTemplate(activeTemplate.id, { greeting: e.target.value })}
              />
            </div>

            <div className="letters-paragraphs-section">
              <div className="letters-section-header">
                <h3>Paragraphs</h3>
                <button 
                  className="letters-btn letters-btn-sm"
                  onClick={() => {
                    const newP: CoverLetterParagraph = {
                      id: createId('clp'),
                      text: 'New paragraph content...',
                      vectors: {}
                    }
                    updateTemplate(activeTemplate.id, { paragraphs: [...activeTemplate.paragraphs, newP] })
                  }}
                >
                  <Plus size={14} /> Add Paragraph
                </button>
              </div>
              
              <div className="letters-paragraph-list">
                {activeTemplate.paragraphs.map((p, index) => (
                  <div key={p.id} className="letters-paragraph-item">
                    <div className="letters-paragraph-content">
                      <textarea 
                        value={p.text}
                        onChange={(e) => updateParagraph(p.id, { text: e.target.value })}
                        rows={3}
                        aria-label={`Paragraph ${index + 1} text`}
                        placeholder="Write your paragraph content..."
                      />
                      <div className="letters-paragraph-vectors">
                        <VectorPriorityEditor
                          vectors={p.vectors}
                          vectorDefs={vectors}
                          onChange={(newVectors) => updateParagraph(p.id, { vectors: newVectors })}
                        />
                      </div>
                    </div>
                    <button 
                      className="letters-btn-icon letters-text-danger"
                      onClick={() => removeParagraph(p.id)}
                      aria-label={`Delete paragraph ${index + 1}`}
                      title={`Delete paragraph ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="letters-field">
              <label htmlFor="cl-signoff">Sign Off</label>
              <textarea 
                id="cl-signoff"
                value={activeTemplate.signOff} 
                onChange={(e) => updateTemplate(activeTemplate.id, { signOff: e.target.value })}
                rows={2}
              />
            </div>

          </div>
        ) : (
          <div className="letters-empty-state">
            <div className="letters-empty-state-content">
              <p>Select or create a template to start building cover letters.</p>
              <button className="letters-btn letters-btn-primary" onClick={handleCreateTemplate}>
                <Plus size={16} /> Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
