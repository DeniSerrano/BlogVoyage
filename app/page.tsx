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
  Thumbnail,
  Tabs,
  Sidebar,
  Stepper,
  Icon,
  Link,
} from '@nimbus-ds/components';
import { InitialScreen, CalloutCard } from '@nimbus-ds/patterns';
import {
  FileAltIcon,
  RocketIcon,
  MagicWandIcon,
  GlobeIcon,
  CheckCircleIcon,
  EditIcon,
  HeartIcon,
  StarIcon,
} from '@nimbus-ds/icons';

interface WPPost {
  wpId: number;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  link: string;
  thumbnail?: string;
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

type Step = 0 | 1 | 2;
type TabIndex = 0 | 1 | 2;

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw new Error(`Respuesta inválida del servidor: ${text.substring(0, 200)}`);
  }
  if (!res.ok && data && !data.success) throw new Error(data.error || `Error HTTP ${res.status}`);
  return data;
}

async function getNexoStoreInfo(nexo: any): Promise<{ id: string; name: string } | null> {
  return new Promise((resolve) => {
    try {
      const unsub = nexo.suscribe('app/store/info', (data: any) => { unsub?.(); resolve(data); });
      nexo.dispatch('app/store/info');
      setTimeout(() => { unsub?.(); resolve(null); }, 3000);
    } catch { resolve(null); }
  });
}

const STEP_LABELS = ['Origen', 'Selección', 'Resultado'];

export default function Page() {
  const [nexoReady, setNexoReady] = useState(false);
  const [nexoError, setNexoError] = useState('');
  const [storeId, setStoreId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [activeStep, setActiveStep] = useState<Step>(0);
  const [selectedStep, setSelectedStep] = useState<Step>(0);

  const [url, setUrl] = useState('');
  const [savedWpUrl, setSavedWpUrl] = useState('');
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

  const [posts, setPosts] = useState<WPPost[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [duplicates, setDuplicates] = useState<Record<string, boolean>>({});
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState('');

  const [previewPost, setPreviewPost] = useState<WPPost | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [autosyncEnabled, setAutosyncEnabled] = useState(false);
  const [autosyncPublish, setAutosyncPublish] = useState(false);
  const [autosyncLastSynced, setAutosyncLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; failed: number } | null>(null);

  useEffect(() => {
    async function initNexo() {
      try {
        const nexoModule = await import('@tiendanube/nexo');
        const create = nexoModule.create || nexoModule.default?.create;
        const connect = nexoModule.connect || nexoModule.default?.connect;
        const iAmReady = nexoModule.iAmReady || nexoModule.default?.iAmReady;
        if (!create || !connect || !iAmReady) throw new Error('Nexo exports not found');
        const nexo = create({ clientId: process.env.NEXT_PUBLIC_TIENDANUBE_CLIENT_ID || '0', log: true });
        await connect(nexo);
        setNexoReady(true);
        iAmReady(nexo);
        const storeInfo = await getNexoStoreInfo(nexo);
        if (storeInfo?.id) {
          setStoreId(storeInfo.id);
        } else {
          try {
            const res = await fetch('/api/auth/store-id');
            const data = await res.json();
            if (data.storeId) setStoreId(data.storeId);
          } catch { }
        }
      } catch (err: any) {
        setNexoError(err?.message || 'Error conectando con Nexo');
      }
    }
    initNexo();
  }, []);

  const loadSettings = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await safeFetch(`/api/wp-url?store_id=${storeId}`);
      if (data.success) {
        if (data.wp_url) { setUrl(data.wp_url); setSavedWpUrl(data.wp_url); }
        setAutosyncEnabled(data.autosync_enabled || false);
        setAutosyncPublish(data.autosync_publish || false);
        setAutosyncLastSynced(data.autosync_last_synced_at || null);
      }
    } catch { }
  }, [storeId]);

  useEffect(() => {
    if (storeId) loadSettings();
  }, [storeId, loadSettings]);

  const loadHistory = useCallback(async () => {
    if (!storeId) return;
    setLoadingHistory(true);
    try {
      const data = await safeFetch(`/api/history?store_id=${storeId}`);
      if (data.success) setHistory(data.history || []);
    } catch { }
    setLoadingHistory(false);
  }, [storeId]);

  useEffect(() => {
    if (activeTab === 1 && storeId) loadHistory();
  }, [activeTab, storeId, loadHistory]);

  const handleSaveUrl = async () => {
    if (!storeId || !url) return;
    setUrlSaving(true);
    try {
      await safeFetch('/api/wp-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, wpUrl: url }),
      });
      setSavedWpUrl(url);
      setUrlSaved(true);
    } catch { }
    setUrlSaving(false);
  };

  const handleAutosyncToggle = async (field: 'enabled' | 'publish', value: boolean) => {
    if (!storeId) return;
    if (field === 'enabled') setAutosyncEnabled(value);
    if (field === 'publish') setAutosyncPublish(value);
    await safeFetch('/api/wp-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId,
        autosync_enabled: field === 'enabled' ? value : autosyncEnabled,
        autosync_publish: field === 'publish' ? value : autosyncPublish,
      }),
    });
  };

  const handleManualSync = async () => {
    if (!storeId) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const data = await safeFetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      if (data.success) {
        setSyncResult({ imported: data.result.imported || 0, failed: data.result.failed || 0 });
        setAutosyncLastSynced(new Date().toISOString());
      }
    } catch { }
    setSyncing(false);
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await safeFetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: savedWpUrl || url }),
      });
      if (!data.success) throw new Error(data.error);
      setPosts(data.posts);
      setSelectedIds(new Set(data.posts.map((p: WPPost) => p.wpId)));
      if (storeId) {
        try {
          const dupData = await safeFetch('/api/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, slugs: data.posts.map((p: WPPost) => p.slug) }),
          });
          if (dupData.success) setDuplicates(dupData.duplicates);
        } catch { }
      }
      setActiveStep(1);
      setSelectedStep(1);
      setActiveTab(0);
    } catch (err: any) {
      setError(err.message || 'Error conectando con WordPress');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!storeId) { setError('No se pudo identificar la tienda. Recargá la app.'); return; }
    setImporting(true);
    setError('');
    try {
      const data = await safeFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl: savedWpUrl || url, storeId, selectedIds: Array.from(selectedIds), overwrite }),
      });
      if (data.success && Array.isArray(data.processed)) {
        setResults(data.processed);
      } else {
        setError(data.error || 'Error desconocido en la importación');
      }
      setActiveStep(2);
      setSelectedStep(2);
    } catch (err: any) {
      setError(err.message);
      setActiveStep(2);
      setSelectedStep(2);
    }
    setImporting(false);
  };

  const toggleSelect = (wpId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(wpId) ? next.delete(wpId) : next.add(wpId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(posts.map((p) => p.wpId)));
  };

  const reset = () => {
    setActiveStep(0);
    setSelectedStep(0);
    setPosts([]);
    setSelectedIds(new Set());
    setDuplicates({});
    setOverwrite(false);
    setResults([]);
    setError('');
  };

  const hasDuplicates = Object.values(duplicates).some(Boolean);
  const selectedDuplicates = posts.filter((p) => selectedIds.has(p.wpId) && duplicates[p.slug]).length;
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const isBlogConfigured = !!savedWpUrl;

  if (!nexoReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        {nexoError ? (
          <Alert appearance="danger" title="Error de conexión"><Text>{nexoError}</Text></Alert>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap="2">
            <Spinner size="large" />
            <Text color="neutral-textDisabled">Conectando...</Text>
          </Box>
        )}
      </Box>
    );
  }

  const WelcomeScreen = (
    <InitialScreen>
      <InitialScreen.Hero
        subtitle="BlogVoyage"
        title="Traé tu blog de WordPress a Tiendanube"
        bullets={
          <>
            <InitialScreen.Bullet icon={<FileAltIcon />} text="Importá tus posts con un clic, con título, contenido, imágenes y SEO" />
            <InitialScreen.Bullet icon={<MagicWandIcon />} text="Seleccioná qué posts querés traer y cuáles dejar" />
            <InitialScreen.Bullet icon={<RocketIcon />} text="Tu contenido en Tiendanube en minutos, sin perder nada" />
          </>
        }
        actions={
          <Button appearance="primary" onClick={() => setActiveTab(2 as TabIndex)}>
            Conectar mi blog
          </Button>
        }
        image={
          <img src="/26970-10-es_AR-logo_200x200.png" alt="BlogVoyage" width="180" style={{ borderRadius: '24px' }} />
        }
      />
    </InitialScreen>
  );

  const MyBlogTab = (
    <Box paddingTop="4" display="flex" flexDirection="column" gap="4">
      {isBlogConfigured ? (
        <>
          <Alert appearance="success" title="Blog conectado">
            <Text>Tu blog de WordPress está configurado y listo para importar.</Text>
          </Alert>
          <Card>
            <Card.Header title="Tu blog de WordPress" />
            <Card.Body>
              <Box display="flex" flexDirection="column" gap="4">
                <Box display="flex" alignItems="center" gap="2">
                  <Icon color="primary-interactive" source={<GlobeIcon />} />
                  <Text fontWeight="bold">{savedWpUrl}</Text>
                </Box>
                <Input
                  label="Cambiar URL"
                  placeholder="https://tu-blog.com"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUrl(e.target.value); setUrlSaved(false); }}
                />
                <Box display="flex" gap="2">
                  <Button appearance="neutral" disabled={!url || url === savedWpUrl || urlSaving} onClick={handleSaveUrl}>
                    {urlSaving ? <Spinner size="small" /> : 'Actualizar URL'}
                  </Button>
                  <Button appearance="primary" onClick={() => { setActiveTab(0 as TabIndex); handlePreview(); }} disabled={loading}>
                    {loading ? <Spinner size="small" /> : 'Importar posts →'}
                  </Button>
                </Box>
              </Box>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header title="Sincronización automática" />
            <Card.Body>
              <Box display="flex" flexDirection="column" gap="4">
                <Checkbox
                  name="autosync_enabled"
                  label="Activar sincronización automática diaria"
                  checked={autosyncEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAutosyncToggle('enabled', e.target.checked)}
                />
                {autosyncEnabled && (
                  <Checkbox
                    name="autosync_publish"
                    label="Publicar posts automáticamente (si no, se guardan como borrador)"
                    checked={autosyncPublish}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAutosyncToggle('publish', e.target.checked)}
                  />
                )}
                {autosyncLastSynced && (
                  <Text fontSize="caption" color="neutral-textLow">
                    Última sincronización: {new Date(autosyncLastSynced).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                <Box display="flex" gap="2" alignItems="center">
                  <Button appearance="neutral" onClick={handleManualSync} disabled={syncing}>
                    {syncing ? (
                      <Box display="flex" alignItems="center" gap="2"><Spinner size="small" /><Text>Sincronizando...</Text></Box>
                    ) : '🔄 Sincronizar ahora'}
                  </Button>
                  {syncResult && (
                    <Tag appearance={syncResult.failed > 0 ? 'warning' : 'success'}>
                      {syncResult.imported} importados{syncResult.failed > 0 ? ` · ${syncResult.failed} fallidos` : ''}
                    </Tag>
                  )}
                </Box>
              </Box>
            </Card.Body>
          </Card>
        </>
      ) : (
        <Card>
          <Card.Header title="Conectar tu blog de WordPress" />
          <Card.Body>
            <Box display="flex" flexDirection="column" gap="4">
              <Text color="neutral-textLow">
                Ingresá la URL de tu blog de WordPress. La guardamos para que no tengas que volver a escribirla.
              </Text>
              <Input
                label="URL de WordPress"
                placeholder="https://tu-blog.com"
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setUrl(e.target.value); setUrlSaved(false); }}
              />
              {urlSaved && (
                <Alert appearance="success" title="¡Blog conectado!">
                  <Text>Ya podés importar tus posts desde la tab Importar.</Text>
                </Alert>
              )}
              {error && <Alert appearance="danger" title="Error"><Text>{error}</Text></Alert>}
              <Button appearance="primary" disabled={!url || urlSaving} onClick={handleSaveUrl}>
                {urlSaving ? <Spinner size="small" /> : 'Guardar y conectar'}
              </Button>
            </Box>
          </Card.Body>
        </Card>
      )}
    </Box>
  );

  return (
    <Box padding="4" display="flex" flexDirection="column" gap="4">
      <Title as="h1">BlogVoyage</Title>

      <Tabs preSelectedTab={0} selected={activeTab} onTabSelect={(i) => setActiveTab(i as TabIndex)}>
        <Tabs.Item label="Importar">
          {!isBlogConfigured && activeStep === 0 && WelcomeScreen}

          {isBlogConfigured && activeStep === 0 && (
            <Box paddingTop="4" display="flex" flexDirection="column" gap="4">
              <Card>
                <Card.Body>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap="3">
                      <Icon color="success-textLow" source={<CheckCircleIcon />} />
                      <Box display="flex" flexDirection="column" gap="1">
                        <Text fontWeight="bold">Blog conectado</Text>
                        <Text fontSize="caption" color="neutral-textLow">{savedWpUrl}</Text>
                      </Box>
                    </Box>
                    <Button appearance="neutral" size="small" onClick={() => setActiveTab(2 as TabIndex)}>
                      <Icon source={<EditIcon />} color="currentColor" />
                      Cambiar
                    </Button>
                  </Box>
                </Card.Body>
              </Card>
              {error && <Alert appearance="danger" title="Error"><Text>{error}</Text></Alert>}
              <Button appearance="primary" onClick={handlePreview} disabled={loading}>
                {loading ? (
                  <Box display="flex" alignItems="center" gap="2"><Spinner size="small" /><Text>Buscando posts...</Text></Box>
                ) : 'Buscar posts'}
              </Button>
            </Box>
          )}

          {activeStep > 0 && (
            <Box paddingTop="4" paddingBottom="4">
              <Stepper
                activeStep={activeStep}
                selectedStep={selectedStep}
                onSelectStep={(step) => { if (step < activeStep) setSelectedStep(step as Step); }}
              >
                {STEP_LABELS.map((label) => (
                  <Stepper.Item key={label} label={label} />
                ))}
              </Stepper>
            </Box>
          )}

          {selectedStep === 1 && (
            <Box display="flex" flexDirection="column" gap="4">
              {hasDuplicates && (
                <Alert appearance="warning" title="Hay posts duplicados">
                  <Box display="flex" flexDirection="column" gap="2">
                    <Text>Algunos posts ya existen en tu tienda.</Text>
                    <Checkbox
                      name="overwrite"
                      label={`Sobreescribir existentes (${selectedDuplicates} seleccionados)`}
                      checked={overwrite}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOverwrite(e.target.checked)}
                    />
                  </Box>
                </Alert>
              )}
              <Card>
                <Card.Body>
                  <Box display="flex" flexDirection="column" gap="3">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" flexDirection="column" gap="1">
                        <Title as="h2">{posts.length} posts encontrados</Title>
                        <Text color="neutral-textLow">{selectedIds.size} seleccionados</Text>
                      </Box>
                      <Button appearance="neutral" size="small" onClick={toggleSelectAll}>
                        {selectedIds.size === posts.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                      </Button>
                    </Box>
                    {posts.map((post) => {
                      const isDup = duplicates[post.slug];
                      const isSelected = selectedIds.has(post.wpId);
                      return (
                        <Box
                          key={post.wpId}
                          display="flex"
                          alignItems="center"
                          gap="3"
                          padding="3"
                          borderColor={isSelected ? 'primary-interactive' : 'neutral-surfaceHighlight'}
                          borderStyle="solid"
                          borderWidth="1"
                          borderRadius="2"
                          backgroundColor={isSelected ? 'primary-surface' : 'neutral-background'}
                        >
                          <Checkbox
                            name={`post-${post.wpId}`}
                            checked={isSelected}
                            onChange={() => toggleSelect(post.wpId)}
                            label=""
                          />
                          {post.thumbnail ? (
                            <Thumbnail src={post.thumbnail} alt={post.title} width="64px" aspectRatio="16/9" />
                          ) : (
                            <Box width="64px" height="36px" backgroundColor="neutral-surfaceHighlight" borderRadius="1" flexShrink={0} />
                          )}
                          <Box display="flex" flexDirection="column" gap="1" flex="1 1 auto">
                            <Box display="flex" alignItems="center" gap="2" flexWrap="wrap">
                              <Text fontWeight="bold">{post.title}</Text>
                              {isDup && <Tag appearance="warning">Duplicado</Tag>}
                            </Box>
                            <Text fontSize="caption" color="neutral-textLow">
                              {new Date(post.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                          </Box>
                          <Button appearance="neutral" size="small" onClick={() => { setPreviewPost(post); setSidebarOpen(true); }}>
                            Ver
                          </Button>
                        </Box>
                      );
                    })}
                    <Box display="flex" gap="2" paddingTop="2">
                      <Button appearance="neutral" onClick={reset}>Volver</Button>
                      <Button appearance="primary" onClick={handleImport} disabled={selectedIds.size === 0 || !storeId || importing}>
                        {importing ? (
                          <Box display="flex" alignItems="center" gap="2"><Spinner size="small" /><Text>Importando...</Text></Box>
                        ) : `Importar ${selectedIds.size} post${selectedIds.size !== 1 ? 's' : ''}`}
                      </Button>
                    </Box>
                  </Box>
                </Card.Body>
              </Card>
            </Box>
          )}

          {selectedStep === 2 && (
            <Card>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  {error ? (
                    <Alert appearance="danger" title="Error en la importación"><Text>{error}</Text></Alert>
                  ) : (
                    <Alert appearance="success" title="¡Importación completada!">
                      <Text>{successCount} de {results.length} posts importados correctamente{failCount > 0 && ` · ${failCount} fallaron`}</Text>
                    </Alert>
                  )}
                  {results.map((r, i) => (
                    <Box key={i} display="flex" alignItems="center" gap="2" padding="2" borderColor="neutral-surfaceHighlight" borderStyle="solid" borderWidth="1" borderRadius="2">
                      <Text>{r.success ? '✅' : '❌'}</Text>
                      <Text flex="1 1 auto">{r.title}</Text>
                      {r.overwritten && <Tag appearance="primary">Actualizado</Tag>}
                    </Box>
                  ))}
                  <Button appearance="primary" onClick={reset}>Nueva importación</Button>
                </Box>
              </Card.Body>
            </Card>
          )}
        </Tabs.Item>

        <Tabs.Item label="Historial">
          <Box paddingTop="4">
            <Card>
              <Card.Body>
                <Box display="flex" flexDirection="column" gap="4">
                  <Title as="h2">Historial de importaciones</Title>
                  {loadingHistory ? (
                    <Box display="flex" justifyContent="center" padding="8"><Spinner size="large" /></Box>
                  ) : history.length === 0 ? (
                    <Box display="flex" flexDirection="column" alignItems="center" gap="2" padding="8">
                      <Text color="neutral-textDisabled">No hay importaciones anteriores.</Text>
                    </Box>
                  ) : (
                    history.map((entry) => (
                      <Box key={entry.id} padding="3" borderColor="neutral-surfaceHighlight" borderStyle="solid" borderWidth="1" borderRadius="2" display="flex" flexDirection="column" gap="2">
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Text fontWeight="bold">{entry.source_url}</Text>
                          <Text fontSize="caption" color="neutral-textLow">
                            {new Date(entry.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Box>
                        <Box display="flex" gap="2">
                          <Tag appearance="success">{entry.successful} exitosos</Tag>
                          {entry.failed > 0 && <Tag appearance="danger">{entry.failed} fallidos</Tag>}
                          <Tag appearance="neutral">Total: {entry.total_posts}</Tag>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Card.Body>
            </Card>
          </Box>
        </Tabs.Item>

        <Tabs.Item label="Mi blog">
          {MyBlogTab}
        </Tabs.Item>
      </Tabs>

      {/* ── Banners al pie ── */}
      <Box display="flex" flexDirection="column" gap="3" paddingTop="2">
        <CalloutCard
          appearance="primary"
          icon={StarIcon}
          title="¿Te está siendo útil BlogVoyage?"
          subtitle="Tu reseña ayuda a que más merchants descubran la app. ¡Solo lleva un minuto!"
          link={
            <Link
              as="a"
              href="https://www.tiendanube.com/tienda-aplicaciones-nube/blogvoyage/rating"
              target="_blank"
              appearance="primary"
              textDecoration="none"
            >
              Dejar una reseña →
            </Link>
          }
        />
        <CalloutCard
          appearance="neutral"
          icon={HeartIcon}
          title="¿Querés apoyar el proyecto?"
          subtitle="BlogVoyage es gratuita y de desarrollo independiente. Cualquier cafecito es bienvenido."
          link={
            <Link
              as="a"
              href="https://cafecito.app/donatio"
              target="_blank"
              appearance="primary"
              textDecoration="none"
            >
              Invitar un cafecito ☕
            </Link>
          }
        />
      </Box>

      <Sidebar open={sidebarOpen} onRemove={() => setSidebarOpen(false)} maxWidth={{ xs: '100%', md: '480px' }}>
        <Sidebar.Header title={previewPost?.title || ''} />
        <Sidebar.Body padding="base">
          {previewPost && (
            <Box display="flex" flexDirection="column" gap="4">
              {previewPost.thumbnail && (
                <Thumbnail src={previewPost.thumbnail} alt={previewPost.title} width="100%" aspectRatio="16/9" />
              )}
              <Text fontSize="caption" color="neutral-textLow">
                {new Date(previewPost.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <Text>{previewPost.excerpt || 'Sin descripción disponible.'}</Text>
              <Button appearance="neutral" as="a" href={previewPost.link} target="_blank">
                Ver en WordPress ↗
              </Button>
            </Box>
          )}
        </Sidebar.Body>
        <Sidebar.Footer padding="base">
          <Box display="flex" gap="2">
            <Button appearance="neutral" onClick={() => setSidebarOpen(false)}>Cerrar</Button>
            <Button
              appearance={previewPost && selectedIds.has(previewPost.wpId) ? 'danger' : 'primary'}
              onClick={() => { if (previewPost) { toggleSelect(previewPost.wpId); setSidebarOpen(false); } }}
            >
              {previewPost && selectedIds.has(previewPost.wpId) ? 'Deseleccionar' : 'Seleccionar'}
            </Button>
          </Box>
        </Sidebar.Footer>
      </Sidebar>
    </Box>
  );
}
