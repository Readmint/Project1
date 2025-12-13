// src/app/editor-dashboard/assigned/[id]/edit/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PenTool, Download, Archive } from 'lucide-react';
import { getJSON, postJSON, ApiError } from '@/lib/api';

// Dynamic import of ReactQuill (no SSR)
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

type Attachment = {
  id: string;
  filename: string;
  mime_type?: string;
  size_bytes?: number;
  uploaded_by?: string;
  uploaded_at?: string;
  public_url?: string | null;
  signed_url?: string | null;
  storage_path?: string | null;
};

type Version = {
  id: string;
  title?: string;
  note?: string;
  created_at?: string;
  restored_from?: string | null;
};

export default function EditorAssignedEditPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const articleId = params?.id || '';

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<any | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [content, setContent] = useState<string>('');
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVersionContent, setSelectedVersionContent] = useState<string | null>(null);
  const [selectedVersionTitle, setSelectedVersionTitle] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    try {
      // Use your lib helper; path is relative to NEXT_PUBLIC_API_BASE which already includes /api
      const resp = await getJSON(`/editor/articles/${encodeURIComponent(articleId)}`);
      if (resp && resp.status === 'success' && resp.data) {
        const { article: art, attachments: atts, versions: vers } = resp.data;
        setArticle(art || null);
        setAttachments(atts || []);
        setVersions(vers || []);
        setContent(art?.content || '');
        try {
          const meta = art?.metadata || {};
          if (meta && meta.seo) {
            setMetaTitle(meta.seo.title || '');
            setMetaDescription(meta.seo.description || '');
          }
          if (meta && meta.editorNotes) setNotes(meta.editorNotes);
        } catch (e) {
          // ignore malformed metadata
        }
      } else {
        console.error('Unexpected response', resp);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('API error loading article:', err.status, err.getDetailedMessage());
        alert(`Failed to load article: ${err.getDetailedMessage()}`);
      } else {
        console.error('Network/load error', err);
        alert('Failed to load article (network error).');
      }
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveDraft = async () => {
    if (!articleId) return;
    setSaving(true);
    try {
      await postJSON(`/editor/articles/${encodeURIComponent(articleId)}/save`, {
        content,
        metaTitle,
        metaDescription,
        notes,
      });
      alert('Draft saved');
      await load();
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('Save draft API error', err.status, err.data);
        alert('Failed to save draft: ' + err.getDetailedMessage());
      } else {
        console.error('Save draft network error', err);
        alert('Failed to save draft (network).');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async (publish = false) => {
    if (!articleId) return;
    const confirmation = confirm(publish ? 'Finalize and mark as approved for publishing?' : 'Finalize and send for review?');
    if (!confirmation) return;
    setFinalizing(true);
    try {
      const resp = await postJSON(`/editor/articles/${encodeURIComponent(articleId)}/finalize`, {
        finalContent: content,
        finalizeAs: publish ? 'publish' : 'review',
      });
      if (resp && resp.status === 'success') {
        alert('Finalized: ' + (resp.data?.status || 'done'));
        await load();
      } else {
        alert('Finalize failed: ' + JSON.stringify(resp));
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('Finalize error', err.status, err.data);
        alert('Failed to finalize: ' + err.getDetailedMessage());
      } else {
        console.error('Finalize network error', err);
        alert('Failed to finalize (network).');
      }
    } finally {
      setFinalizing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!articleId) return;
    const message = prompt('Enter change request message for the author:');
    if (message === null) return;
    try {
      await postJSON(`/editor/articles/${encodeURIComponent(articleId)}/request-changes`, {
        message,
        severity: 'Medium',
      });
      alert('Change request sent to author');
      await load();
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('Request changes API error', err.status, err.data);
        alert('Failed to request changes: ' + err.getDetailedMessage());
      } else {
        console.error('Request changes network error', err);
        alert('Failed to request changes (network).');
      }
    }
  };

  const openAttachment = (att: Attachment) => {
    const url = att.signed_url || att.public_url;
    if (!url) {
      alert('No read URL available for this attachment');
      return;
    }
    window.open(url, '_blank');
  };

  const openVersion = async (v: Version) => {
    try {
      const resp = await getJSON(`/editor/version/${encodeURIComponent(v.id)}`);
      if (resp && resp.status === 'success' && resp.data) {
        setSelectedVersionContent(resp.data.content || resp.data.meta || '');
        setSelectedVersionTitle(resp.data.title || v.title || '');
        setShowVersionModal(true);
      } else {
        alert('Unable to fetch version content');
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        console.error('Get version API error', err.status, err.data);
        alert('Failed to fetch version: ' + err.getDetailedMessage());
      } else {
        console.error('Get version network error', err);
        alert('Failed to fetch version (network).');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Assigned Article</h1>
            <p className="text-sm text-slate-500">{article?.title || (loading ? 'Loading...' : 'Untitled')}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSaveDraft} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PenTool size={14} /> {saving ? 'Saving...' : 'Save Draft'}
            </Button>

            <Button onClick={() => handleFinalize(false)} disabled={finalizing} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              {finalizing ? 'Finalizing...' : 'Finalize (Review)'}
            </Button>

            <Button onClick={() => handleFinalize(true)} disabled={finalizing} className="bg-green-600 hover:bg-green-700 text-white">
              Finalize & Approve
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Editor */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl">
              <CardContent>
                <input
                  placeholder="Meta title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full mb-3 p-2 rounded border"
                />
                <input
                  placeholder="Meta description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full mb-3 p-2 rounded border"
                />

                <div className="mb-3">
                  {/* ReactQuill editor */}
                  <ReactQuill value={content} onChange={setContent} modules={{
                    toolbar: [
                      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'script': 'sub' }, { 'script': 'super' }],
                      [{ 'header': '1' }, { 'header': '2' }, 'blockquote', 'code-block'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                      [{ 'direction': 'rtl' }, { 'align': [] }],
                      ['link', 'image', 'video'],
                      ['clean']
                    ]
                  }} formats={[
                    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'bullet', 'indent', 'link', 'image', 'video', 'color', 'background', 'align', 'code-block', 'script'
                  ]} />
                </div>

                <div className="mt-3">
                  <textarea
                    placeholder="Editor notes (visible to other editors/admins)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 rounded border h-24"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Button onClick={handleRequestChanges} className="bg-rose-600 hover:bg-rose-700 text-white">
                    Request Changes
                  </Button>
                  <Button onClick={() => router.back()} variant="ghost">Back</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: metadata, attachments, versions */}
          <div>
            <Card className="rounded-2xl mb-4">
              <CardContent>
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {attachments.length === 0 && <p className="text-sm text-slate-500">No attachments</p>}
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="text-sm font-medium">{att.filename}</div>
                        <div className="text-xs text-slate-500">{att.mime_type || ''} • {att.size_bytes ? `${Math.round(att.size_bytes / 1024)} KB` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openAttachment(att)} className="px-2 py-1">
                          <Download size={14} />
                        </Button>
                        <a href={att.signed_url || att.public_url || '#'} target="_blank" rel="noreferrer" className="text-xs text-slate-500 underline">Open</a>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Versions</h3>
                  <div className="text-xs text-slate-500 flex items-center gap-1"><Archive size={12} /> {versions.length}</div>
                </div>

                <div className="space-y-2">
                  {versions.length === 0 && <p className="text-sm text-slate-500">No saved versions yet</p>}
                  {versions.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <div className="text-sm font-medium">{v.title || 'Untitled version'}</div>
                        <div className="text-xs text-slate-500">{v.created_at ? new Date(v.created_at).toLocaleString() : ''}</div>
                      </div>
                      <div>
                        <Button size="sm" onClick={() => openVersion(v)} className="px-2 py-1">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Version modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-8">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowVersionModal(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">{selectedVersionTitle || 'Version'}</h4>
              <Button onClick={() => setShowVersionModal(false)}>Close</Button>
            </div>
            <div className="prose dark:prose-invert max-h-[60vh] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: String(selectedVersionContent || '') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
