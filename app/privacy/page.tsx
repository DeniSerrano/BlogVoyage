export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Política de Privacidad</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>Última actualización: marzo 2026</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>¿Qué datos recopilamos?</h2>
      <p>BlogVoyage recopila y almacena la siguiente información de las tiendas que instalan la aplicación:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li>ID de la tienda en Tiendanube</li>
        <li>Token de acceso OAuth para operar en nombre de la tienda</li>
        <li>URL del blog de WordPress configurado por el merchant</li>
        <li>Historial de importaciones realizadas (fecha, origen, cantidad de posts)</li>
        <li>Preferencias de sincronización automática</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>¿Para qué usamos esos datos?</h2>
      <p>Los datos recopilados se utilizan exclusivamente para:</p>
      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
        <li>Autenticar las solicitudes a la API de Tiendanube en nombre de la tienda</li>
        <li>Importar posts desde WordPress al blog de Tiendanube</li>
        <li>Ejecutar sincronizaciones automáticas programadas</li>
        <li>Mostrar el historial de importaciones al merchant</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>¿Compartimos datos con terceros?</h2>
      <p>No. BlogVoyage no vende, alquila ni comparte datos de las tiendas con terceros. Los datos se almacenan de forma segura en Supabase y solo son accesibles por la aplicación.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Datos de clientes finales</h2>
      <p>BlogVoyage no recopila ni almacena datos de los clientes finales de las tiendas. La aplicación opera únicamente con contenido editorial (posts de blog) y no accede a información de compradores, pedidos ni datos personales de terceros.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Eliminación de datos</h2>
      <p>Al desinstalar BlogVoyage, todos los datos asociados a la tienda (token de acceso, URL de WordPress, historial de importaciones) son eliminados automáticamente de nuestros servidores en un plazo máximo de 30 días.</p>

      <h2 style={{ fontSize: '20px', fontWeight: '600', marginTop: '32px', marginBottom: '12px' }}>Contacto</h2>
      <p>Para consultas sobre privacidad o solicitudes de eliminación de datos, escribinos a <a href="mailto:den@tiendanube.com" style={{ color: '#1a6fff' }}>den@tiendanube.com</a></p>
    </div>
  );
}