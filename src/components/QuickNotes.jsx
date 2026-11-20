import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Check,
  Search,
  Copy,
  Calendar,
  Sparkles
} from 'lucide-react';
import './QuickNotes.css';

const STORAGE_KEY = 'neotools_quick_notes';

const COLOR_TAGS = [
  { id: 'purple', label: 'Purple', bg: '#2b1442', border: '#7c3aed' },
  { id: 'pink', label: 'Pink', bg: '#361329', border: '#ec4899' },
  { id: 'blue', label: 'Blue', bg: '#10233f', border: '#3b82f6' },
  { id: 'emerald', label: 'Green', bg: '#0d281e', border: '#10b981' },
  { id: 'amber', label: 'Amber', bg: '#331f0a', border: '#f59e0b' }
];

const INITIAL_NOTES = [
  {
    id: '1',
    title: 'Welcome to Quick Notes ✦',
    content: 'Your thoughts, snippets, and to-do items are automatically saved directly in your browser. Feel free to edit or delete this note!',
    color: 'purple',
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Project Ideas',
    content: '1. Launch NeoTools 2.0 with all 11 working utilities.\n2. Add keyboard shortcuts for power users.\n3. Make everything 100% private and client-side.',
    color: 'blue',
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export default function QuickNotes({ onBack }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState(() => notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('purple');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch notes from backend on mount
  useEffect(() => {
    fetch('/api/notes')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((n) => ({
            ...n,
            id: n.id || n._id
          }));
          setNotes(normalized);
          setActiveNoteId(normalized[0]?.id);
        }
      })
      .catch(() => {
        // Fallback to localStorage if backend offline
      });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Storage error handled
    }
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeNoteId || n._id === activeNoteId) || null;

  const handleCreateNote = async () => {
    const tempId = Date.now().toString();
    const newNote = {
      id: tempId,
      title: 'Untitled Note',
      content: '',
      color: 'purple',
      updatedAt: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(tempId);
    setEditTitle(newNote.title);
    setEditContent('');
    setEditColor('purple');
    setIsEditing(true);

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          color: newNote.color
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const createdId = data.data.id || data.data._id;
        setNotes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: createdId } : n))
        );
        setActiveNoteId(createdId);
      }
    } catch {
      // Offline fallback
    }
  };

  const handleStartEdit = (note) => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color || 'purple');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!activeNoteId) return;
    const finalTitle = editTitle.trim() || 'Untitled Note';

    setNotes((prev) =>
      prev.map((n) =>
        (n.id === activeNoteId || n._id === activeNoteId)
          ? {
              ...n,
              title: finalTitle,
              content: editContent,
              color: editColor,
              updatedAt: new Date().toISOString()
            }
          : n
      )
    );
    setIsEditing(false);

    try {
      await fetch(`/api/notes/${activeNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          content: editContent,
          color: editColor
        })
      });
    } catch {
      // Offline fallback
    }
  };

  const handleDeleteNote = async (id) => {
    const filtered = notes.filter((n) => n.id !== id && n._id !== id);
    setNotes(filtered);
    if (activeNoteId === id) {
      setActiveNoteId(filtered[0]?.id || filtered[0]?._id || null);
      setIsEditing(false);
    }

    try {
      await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });
    } catch {
      // Offline fallback
    }
  };

  const handleCopyNote = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
    }
  };

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <section className="notes-page">
      <div className="notes-container">
        <button className="notes-back-btn" onClick={onBack} aria-label="Back to tools">
          <ArrowLeft size={18} />
          <span>Back to tools</span>
        </button>

        <header className="notes-header">
          <div className="notes-icon-wrapper">
            <FileText size={28} />
          </div>
          <h1>Quick <span className="gradient-text">Notes.</span></h1>
          <p>Capture thoughts, code snippets, and daily tasks. Saved privately in your browser.</p>
        </header>

        <div className="notes-workspace">
          {/* Notes Sidebar */}
          <aside className="notes-sidebar">
            <div className="notes-sidebar-header">
              <div className="notes-search-wrap">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="notes-search-input"
                />
              </div>

              <button
                type="button"
                className="notes-new-btn"
                onClick={handleCreateNote}
                title="Create a new note"
              >
                <Plus size={16} /> New Note
              </button>
            </div>

            <div className="notes-list">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  const isActive = note.id === activeNoteId;
                  const tag = COLOR_TAGS.find((c) => c.id === note.color) || COLOR_TAGS[0];

                  return (
                    <article
                      key={note.id}
                      className={`note-list-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveNoteId(note.id);
                        setIsEditing(false);
                      }}
                      style={{ borderLeftColor: tag.border }}
                    >
                      <div className="note-item-top">
                        <strong className="note-item-title">{note.title}</strong>
                        <button
                          type="button"
                          className="note-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          title="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <p className="note-item-preview">
                        {note.content ? note.content.substring(0, 75) + '...' : 'No content yet'}
                      </p>
                      <span className="note-item-date">
                        <Calendar size={11} /> {formatDate(note.updatedAt)}
                      </span>
                    </article>
                  );
                })
              ) : (
                <div className="notes-empty-sidebar">
                  <p>{searchQuery ? 'No matching notes found.' : 'No notes yet. Create one!'}</p>
                </div>
              )}
            </div>
          </aside>

          {/* Notes Reader / Editor */}
          <main className="notes-main-pane">
            {activeNote ? (
              isEditing ? (
                /* Editing Mode */
                <div className="note-edit-container">
                  <div className="note-edit-bar">
                    <input
                      type="text"
                      className="note-title-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note Title"
                      autoFocus
                    />

                    <div className="note-color-picker">
                      {COLOR_TAGS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`color-dot ${editColor === t.id ? 'active' : ''}`}
                          style={{ backgroundColor: t.border }}
                          onClick={() => setEditColor(t.id)}
                          title={`Color ${t.label}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      className="note-save-btn"
                      onClick={handleSaveEdit}
                    >
                      <Check size={16} /> Save
                    </button>
                  </div>

                  <textarea
                    className="note-body-textarea"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your note here..."
                    rows={16}
                  />
                </div>
              ) : (
                /* Viewing Mode */
                <div className="note-view-container">
                  <div className="note-view-header">
                    <div>
                      <h2>{activeNote.title}</h2>
                      <span className="note-view-meta">
                        <Calendar size={13} /> Last updated {formatDate(activeNote.updatedAt)}
                      </span>
                    </div>

                    <div className="note-view-actions">
                      <button
                        type="button"
                        className="note-action-btn"
                        onClick={() => handleCopyNote(activeNote.content, activeNote.id)}
                        title="Copy note content"
                      >
                        {copiedId === activeNote.id ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copiedId === activeNote.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        className="note-action-btn primary"
                        onClick={() => handleStartEdit(activeNote)}
                        title="Edit note"
                      >
                        <Edit3 size={15} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="note-action-btn danger"
                        onClick={() => handleDeleteNote(activeNote.id)}
                        title="Delete note"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="note-view-body">
                    {activeNote.content ? (
                      <pre className="note-pre">{activeNote.content}</pre>
                    ) : (
                      <p className="note-empty-body">
                        This note is currently empty. Click &quot;Edit&quot; above to add your thoughts!
                      </p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="notes-no-selection">
                <div className="no-sel-icon">
                  <Sparkles size={32} />
                </div>
                <h3>No note selected</h3>
                <p>Choose a note from the left, or create a fresh one to get started.</p>
                <button
                  type="button"
                  className="notes-new-btn centered"
                  onClick={handleCreateNote}
                >
                  <Plus size={16} /> Create New Note
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

