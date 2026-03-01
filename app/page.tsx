'use client';

import React, { useEffect, useState, useCallback } from 'react';
import '@nimbus-ds/styles/dist/index.css';
import {
  Box,
  Card,
  Title,
  Text,
  Button,
  Input,
  Alert,
  Checkbox,
  Spinner,
  Tag,
  Icon,
  Link,
} from '@nimbus-ds/components';

// ─── Types ───
interface WPPost {
  wpId: number;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  link: string;
}

interface ImportResult {
  wpId: number;
  title: string;
  success: boolean;
  overwritten: boolean;
}

interface HistoryEntry {
  id: number;
  source_url: string;
  total_posts: number;
  successful: number;
  failed: number;
  created_at: string;
  details: ImportResult[];
}

type Step = 'url' | 'preview' | 'importing' | 'done';
type Tab = 'import' | 'history';

export default function Page() {
  // Nexo state
  const [nexoReady, setNexoReady] = useState(false);
  const [nexoError, setNexoError] = useState('');

  // App state
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<Step>('url');
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [duplicates, setDuplicates] = useState<Record<string, boolean>>({});
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ─── Init Nexo ───
  useEffect(() => {
    async function initNexo() {
      try {
        const { create, connect, iAmReady } = await import('@tiendanube/nexo');
        const nexo = create({
          clientId: process.env.NEXT_PUBLIC_TIENDANUBE_CLIENT_ID || '0',
          log: true,
        });
        await connect(nexo);
        setNexoReady(true);
        iAmReady(nexo);
      } catch (err: any) {
        setNexoError(err?.message || 'Error conectando con Nexo');
      }
    }
    initNexo();
  }, []);

  // ─── Get store_id from URL or cookie ───
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get('store_id');
      if (sid) setStoreId(sid);
    }
  }, []);

  // ─── Load history ───
  const loadHistory = useCallback(async () => {
    if (!storeId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?store_id=${storeId}`);
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch {}
    setLoadingHistory(false);
  }, [storeId]);

  useEffect(() => {
    if (activeTab === 'history' && storeId) loadHistory();
  }, [activeTab, storeId, loadHistory]);

  // ─── Preview ───
  const handlePreview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setPosts(data.posts);
      setSelectedIds(new Set(data.posts.map((p: WPPost) => p.wpId)));

      // Check duplicates
      if (storeId) {
        const slugs = data.posts.map((p: WPPost) => p.slug);
        const dupRes = await fetch('/api/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, slugs }),
        });
        const dupData = await dupRes.json();
        if (dupData.success) setDuplicates(dupData.duplicates);
      }

      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Error conectando con WordPress');
    }
    setLoading(false);
  };

  // ─── Import ───
  const handleImport = async () => {
    setStep('importing');
    setProgress(0);
    setResults([]);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpUrl: url,
          storeId,
          selectedIds: Array.from(selectedIds),
          overwrite,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResults(data.processed);
        const total = data.processed.length;
        for (let i = 1; i <= total; i++) {
          setProgress(Math.round((i / total) * 100));
          await new Promise((r) => setTimeout(r, 80));
        }
      } else {
        setError(data.error);
      }
      setStep('done');
    } catch (err: any) {
      setError(err.message);
      setStep('done');
    }
  };

  const toggleSelect = (wpId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wpId)) next.delete(wpId);
      else next.add(wpId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(posts.map((p) => p.wpId)));
  };

  const reset = () => {
    setStep('url');
    setPosts([]);
    setSelectedIds(new Set());
    setDuplicates({});
    setOverwrite(false);
    setResults([]);
    setError('');
    setProgress(0);
  };

  const hasDuplicates = Object.values(duplicates).some(Boolean);
  const selectedDuplicates = posts.filter(
    (p) => selectedIds.has(p.wpId) && duplicates[p.slug]
  ).length;
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  // ─── Nexo loading / error ───
  if (!nexoReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        {nexoError ? (
          <Alert appearance="danger" title="Error de conexión">
            <Text>{nexoError}</Text>
          </Alert>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap="2">
            <Spinner size="large" />
            <Text color="neutral-textDisabled">Conectando con el admin...</Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box padding="4" display="flex" flexDirection="column" gap="4">
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Title as="h1">Migrador de Blogs</Title>
        {storeId && (
          <Tag appearance="primary">Tienda #{storeId}</Tag>
        )}
      </Box>

      {/* Tabs */}
      <Box display="flex" gap="2">
        <Button
          appearance={activeTab === 'import' ? 'primary' : 'neutral'}
          onClick={() => setActiveTab('import')}
        >
          Importar
        </Button>
        <Button
          appearance={activeTab === 'history' ? 'primary' : 'neutral'}
          onClick={() => setActiveTab('history')}
        >
          Historial
        </Button>
      </Box>

      {/* ═══ IMPORT TAB ═══ */}
      {activeTab === 'import' && (
        <>
          {/* STEP: URL */}
          {step === 'url' && (
            <Card>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Box>
                    <Title as="h2">Importar desde WordPress</Title>
                    <Text>
                      Ingresá la URL del blog de WordPress para ver los posts disponibles.
                    </Text>
                  </Box>
                  <Input
                    label="URL de WordPress"
                    placeholder="https://tu-blog.com"
                    value={url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  />
                  {error && (
                    <Alert appearance="danger" title="Error">
                      <Text>{error}</Text>
                    </Alert>
                  )}
                  <Button
                    appearance="primary"
                    onClick={handlePreview}
                    disabled={loading || !url}
                  >
                    {loading ? 'Buscando posts...' : 'Buscar Posts'}
                  </Button>
                </Box>
              </Card.Body>
            </Card>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <Box display="flex" flexDirection="column" gap="4">
              {/* Duplicate warning */}
              {hasDuplicates && (
                <Alert appearance="warning" title="Se encontraron páginas duplicadas">
                  <Box display="flex" flexDirection="column" gap="2">
                    <Text>
                      Algunos posts ya existen como páginas en tu tienda.
                      ¿Querés sobreescribirlos?
                    </Text>
                    <Checkbox
                      name="overwrite"
                      label={`Sobreescribir páginas existentes (${selectedDuplicates} duplicados seleccionados)`}
                      checked={overwrite}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverwrite(e.target.checked)}
                    />
                  </Box>
                </Alert>
              )}

              <Card>
                <Card.Body>
                  <Box display="flex" flexDirection="column" gap="4">
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Title as="h2">{posts.length} posts encontrados</Title>
                        <Text color="neutral-textDisabled">
                          {selectedIds.size} seleccionados
                        </Text>
                      </Box>
                      <Button appearance="neutral" onClick={toggleSelectAll}>
                        {selectedIds.size === posts.length
                          ? 'Deseleccionar todo'
                          : 'Seleccionar todo'}
                      </Button>
                    </Box>

                    {/* Post list */}
                    {posts.map((post) => {
                      const isDup = duplicates[post.slug];
                      return (
                        <Box
                          key={post.wpId}
                          display="flex"
                          alignItems="flex-start"
                          gap="2"
                          padding="2"
                          borderColor={selectedIds.has(post.wpId) ? 'primary-interactive' : 'neutral-surfaceHighlight'}
                          borderStyle="solid"
                          borderWidth="1"
                          borderRadius="2"
                        >
                          <Checkbox
                            name={`post-${post.wpId}`}
                            checked={selectedIds.has(post.wpId)}
                            onChange={() => toggleSelect(post.wpId)}
                            label=""
                          />
                          <Box display="flex" flexDirection="column" gap="1" flex="1 1 auto">
                            <Box display="flex" alignItems="center" gap="2">
                              <Text fontWeight="bold">{post.title}</Text>
                              {isDup && (
                                <Tag appearance="warning">Duplicado</Tag>
                              )}
                            </Box>
                            <Text fontSize="caption" color="neutral-textDisabled">
                              {post.excerpt || 'Sin descripción'}
                            </Text>
                            <Text fontSize="caption" color="neutral-textDisabled">
                              {new Date(post.date).toLocaleDateString('es-AR')}
                            </Text>
                          </Box>
                        </Box>
                      );
                    })}

                    {/* Actions */}
                    <Box display="flex" gap="2">
                      <Button appearance="neutral" onClick={reset}>
                        Volver
                      </Button>
                      <Button
                        appearance="primary"
                        onClick={handleImport}
                        disabled={selectedIds.size === 0}
                      >
                        Importar {selectedIds.size} post{selectedIds.size !== 1 ? 's' : ''}
                      </Button>
                    </Box>
                  </Box>
                </Card.Body>
              </Card>
            </Box>
          )}

          {/* STEP: IMPORTING */}
          {step === 'importing' && (
            <Card>
              <Card.Body>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap="4"
                  padding="8"
                >
                  <Spinner size="large" />
                  <Title as="h2">Importando...</Title>
                  <Text color="neutral-textDisabled">
                    Creando páginas en tu tienda de Tiendanube
                  </Text>
                  {/* Progress bar */}
                  <Box width="100%">
                    <Box
                      backgroundColor="neutral-surfaceHighlight"
                      borderRadius="2"
                      height="8px"
                      overflow="hidden"
                      width="100%"
                    >
                      <Box
                        backgroundColor="primary-interactive"
                        height="8px"
                        borderRadius="2"
                        width={`${progress}%`}
                        style={{ transition: 'width 0.3s ease' } as any}
                      />
                    </Box>
                    <Box display="flex" justifyContent="center" paddingTop="2">
                      <Text fontWeight="bold" color="primary-interactive">
                        {progress}%
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Card.Body>
            </Card>
          )}

          {/* STEP: DONE */}
          {step === 'done' && (
            <Card>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  {error ? (
                    <Alert appearance="danger" title="Error en la importación">
                      <Text>{error}</Text>
                    </Alert>
                  ) : (
                    <>
                      <Alert appearance="success" title="¡Importación finalizada!">
                        <Text>
                          {successCount} de {results.length} posts importados correctamente
                          {failCount > 0 && ` (${failCount} fallaron)`}
                        </Text>
                      </Alert>

                      {/* Results list */}
                      {results.map((r, i) => (
                        <Box
                          key={i}
                          display="flex"
                          alignItems="center"
                          gap="2"
                          padding="2"
                          borderColor="neutral-surfaceHighlight"
                          borderStyle="solid"
                          borderWidth="1"
                          borderRadius="2"
                        >
                          <Text>{r.success ? '✅' : '❌'}</Text>
                          <Text flex="1 1 auto">{r.title}</Text>
                          {r.overwritten && (
                            <Tag appearance="primary">Actualizado</Tag>
                          )}
                        </Box>
                      ))}
                    </>
                  )}

                  <Button appearance="primary" onClick={reset}>
                    Nueva importación
                  </Button>
                </Box>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <Card>
          <Card.Body>
            <Box display="flex" flexDirection="column" gap="4">
              <Title as="h2">Historial de importaciones</Title>
              {loadingHistory ? (
                <Box display="flex" justifyContent="center" padding="8">
                  <Spinner size="large" />
                </Box>
              ) : history.length === 0 ? (
                <Text color="neutral-textDisabled">
                  No hay importaciones anteriores.
                </Text>
              ) : (
                history.map((entry) => (
                  <Box
                    key={entry.id}
                    padding="3"
                    borderColor="neutral-surfaceHighlight"
                    borderStyle="solid"
                    borderWidth="1"
                    borderRadius="2"
                    display="flex"
                    flexDirection="column"
                    gap="1"
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold">{entry.source_url}</Text>
                      <Text fontSize="caption" color="neutral-textDisabled">
                        {new Date(entry.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                    <Box display="flex" gap="2">
                      <Tag appearance="success">{entry.successful} exitosos</Tag>
                      {entry.failed > 0 && (
                        <Tag appearance="danger">{entry.failed} fallidos</Tag>
                      )}
                      <Tag appearance="neutral">Total: {entry.total_posts}</Tag>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Card.Body>
        </Card>
      )}
    </Box>
  );
}
