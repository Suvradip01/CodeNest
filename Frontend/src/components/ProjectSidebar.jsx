import React, { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  FileCode,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { downloadProjectApi } from '../services/api'

const LANG_COLORS = {
  javascript: 'text-yellow-400',
  python: 'text-blue-400',
  java: 'text-orange-400',
  c: 'text-cyan-400',
}

const LANG_EXT = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
}

function InlineInput({ placeholder, defaultValue = '', onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="flex items-center gap-1 px-2">
      <input
        autoFocus
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') onConfirm(value)
          if (event.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="flex-1 text-xs bg-muted/50 border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50"
      />
      <button onClick={() => onConfirm(value)} className="p-1 hover:text-emerald-500 text-muted-foreground">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={onCancel} className="p-1 hover:text-red-500 text-muted-foreground">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function ProjectSidebar({ store, onFileOpen, onClose }) {
  const {
    projects,
    activeProjectId,
    activeFileId,
    setActiveProjectId,
    setActiveFileId,
    createProject,
    renameProject,
    deleteProject,
    createFile,
    renameFile,
    deleteFile,
    isLoading,
  } = store

  const [expandedProjects, setExpandedProjects] = useState({})
  const [addingProject, setAddingProject] = useState(false)
  const [addingFileFor, setAddingFileFor] = useState(null)
  const [renamingProject, setRenamingProject] = useState(null)
  const [renamingFile, setRenamingFile] = useState(null)
  const [newFileLang, setNewFileLang] = useState('javascript')
  const [isBusy, setIsBusy] = useState(false)
  const [sidebarError, setSidebarError] = useState('')

  const toggleExpand = (projectId) => {
    setExpandedProjects(current => ({ ...current, [projectId]: !current[projectId] }))
  }

  const withTask = async (task) => {
    setSidebarError('')
    setIsBusy(true)
    try {
      return await task()
    } catch (error) {
      setSidebarError(error?.response?.data?.error || error?.message || 'Action failed')
      throw error
    } finally {
      setIsBusy(false)
    }
  }

  const handleCreateProject = async (name) => {
    if (!name.trim()) {
      setAddingProject(false)
      return
    }

    const project = await withTask(() => createProject(name.trim()))
    setExpandedProjects(current => ({ ...current, [project.id]: true }))
    setAddingProject(false)
  }

  const handleCreateFile = async (projectId, name) => {
    if (!name.trim()) {
      setAddingFileFor(null)
      return
    }

    const file = await withTask(() => createFile(projectId, name.trim(), newFileLang, ''))
    onFileOpen?.(file, newFileLang)
    setAddingFileFor(null)
  }

  const handleDownload = async (projectId, projectName) => {
    await withTask(() => downloadProjectApi(projectId, projectName))
  }

  return (
    <div className="w-72 h-full bg-white dark:bg-black/70 backdrop-blur-2xl border-r border-border flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Projects</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAddingProject(true)}
            title="New Project"
            disabled={isBusy}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {sidebarError && (
        <div className="mx-3 mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {sidebarError}
        </div>
      )}

      <div className="flex-1 overflow-auto py-2">
        {(isLoading || isBusy) && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          </div>
        )}

        {addingProject && (
          <div className="py-1">
            <InlineInput
              placeholder="Project name..."
              onConfirm={handleCreateProject}
              onCancel={() => setAddingProject(false)}
            />
          </div>
        )}

        {!isLoading && projects.length === 0 && !addingProject && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <FolderOpen className="w-8 h-8 text-muted/30" />
            <p className="text-xs text-muted-foreground">No projects yet. Create one to start building.</p>
          </div>
        )}

        {!isLoading && projects.map(project => {
          const isExpanded = Boolean(expandedProjects[project.id])
          const isActive = project.id === activeProjectId

          return (
            <div key={project.id}>
              <div className={`group flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                <button onClick={() => toggleExpand(project.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isExpanded
                  ? <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <Folder className="w-3.5 h-3.5 text-primary/60 shrink-0" />}

                {renamingProject === project.id ? (
                  <div className="flex-1">
                    <InlineInput
                      defaultValue={project.name}
                      onConfirm={async (value) => {
                        if (value.trim()) await withTask(() => renameProject(project.id, value.trim()))
                        setRenamingProject(null)
                      }}
                      onCancel={() => setRenamingProject(null)}
                    />
                  </div>
                ) : (
                  <span
                    onClick={() => {
                      setActiveProjectId(project.id)
                      toggleExpand(project.id)
                    }}
                    className={`flex-1 text-xs truncate font-medium ${isActive ? 'text-primary' : 'text-foreground/80'}`}
                  >
                    {project.name}
                  </span>
                )}

                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={() => handleDownload(project.id, project.name)} title="Download project" className="p-1 hover:text-emerald-500 text-muted-foreground transition-colors">
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      setAddingFileFor(project.id)
                      setActiveProjectId(project.id)
                      setExpandedProjects(current => ({ ...current, [project.id]: true }))
                    }}
                    title="New File"
                    className="p-1 hover:text-primary text-muted-foreground transition-colors"
                  >
                    <FilePlus className="w-3 h-3" />
                  </button>
                  <button onClick={() => setRenamingProject(project.id)} className="p-1 hover:text-blue-500 text-muted-foreground transition-colors">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => withTask(() => deleteProject(project.id))} className="p-1 hover:text-red-500 text-muted-foreground transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-6 border-l border-white/10">
                  {addingFileFor === project.id && (
                    <div className="py-1 space-y-1">
                      <div className="flex gap-1 px-2">
                        {['javascript', 'python', 'java', 'c'].map(language => (
                          <button
                            key={language}
                            onClick={() => setNewFileLang(language)}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-colors ${newFileLang === language ? 'bg-violet-500/30 text-violet-300' : 'text-white/30 hover:text-white/60'}`}
                          >
                            {LANG_EXT[language]}
                          </button>
                        ))}
                      </div>
                      <InlineInput
                        placeholder={`filename${LANG_EXT[newFileLang]}`}
                        onConfirm={(value) => handleCreateFile(project.id, value)}
                        onCancel={() => setAddingFileFor(null)}
                      />
                    </div>
                  )}

                  {project.files.map(file => {
                    const isFileActive = file.id === activeFileId

                    return (
                      <div
                        key={file.id}
                        className={`group flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors ${isFileActive ? 'bg-blue-500/10' : ''}`}
                      >
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${LANG_COLORS[file.language] || 'text-white/40'}`} />
                        {renamingFile?.fileId === file.id ? (
                          <div className="flex-1">
                            <InlineInput
                              defaultValue={file.name}
                              onConfirm={async (value) => {
                                if (value.trim()) await withTask(() => renameFile(project.id, file.id, value.trim()))
                                setRenamingFile(null)
                              }}
                              onCancel={() => setRenamingFile(null)}
                            />
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setActiveFileId(file.id)
                              setActiveProjectId(project.id)
                              onFileOpen?.(file, file.language)
                            }}
                            className={`flex-1 text-xs truncate ${isFileActive ? 'text-blue-300 font-medium' : 'text-white/60'}`}
                          >
                            {file.name}
                          </span>
                        )}
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button onClick={() => setRenamingFile({ projectId: project.id, fileId: file.id })} className="p-0.5 hover:text-blue-400 text-white/20">
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button onClick={() => withTask(() => deleteFile(project.id, file.id))} className="p-0.5 hover:text-red-400 text-white/20">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {project.files.length === 0 && addingFileFor !== project.id && (
                    <p className="text-[10px] text-muted-foreground/50 px-3 py-2 italic">No files yet - click + to add one</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
