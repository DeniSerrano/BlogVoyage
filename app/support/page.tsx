export default function SupportPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Soporte</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Estamos para ayudarte con cualquier consulta sobre BlogVoyage.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>¿Cómo funciona BlogVoyage?</h2>
      <p>BlogVoyage te permite importar posts de tu blog de WordPress directamente al blog de tu tienda en Tiendanube. Podés seleccionar qué posts importar, y la app se encarga de traer el contenido, las imágenes destacadas y los metadatos de SEO.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Preguntas frecuentes</h2>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '8px' }}>¿Por qué no aparecen mis posts?</h3>
      <p>Verificá que tu sitio WordPress tenga la API REST habilitada. Podés comprobarlo accediendo a <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>https://tu-blog.com/wp-json/wp/v2/posts</code> desde el navegador. Si ves un listado de posts en formato JSON, la API está activa.</p>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '8px' }}>¿Por qué algunos posts fallan al importarse?</h3>
      <p>El error más común es que el blog de Tiendanube no esté configurado. Asegurate de haber creado un blog desde el administrador de tu tienda antes de importar.</p>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '8px' }}>¿La sincronización automática funciona con cualquier WordPress?</h3>
      <p>Sí, siempre que tu sitio WordPress tenga la API REST pública habilitada. La sincronización corre una vez por día y trae los posts nuevos publicados desde la última sincronización.</p>

      <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '8px' }}>¿Puedo importar posts en otros idiomas?</h3>
      <p>Sí, BlogVoyage importa el contenido tal como está en WordPress. El campo de idioma se configura como español por defecto, pero el contenido es el que tengas en tu blog.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Contacto</h2>
      <p>Si tu consulta no está resuelta en las preguntas frecuentes, escribinos a <a href="mailto:den@tiendanube.com" style={{ color: '#1a6fff' }}>den@tiendanube.com</a> y te respondemos a la brevedad.</p>
    </div>
  );
}