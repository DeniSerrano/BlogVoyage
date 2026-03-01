const handleImport = async () => {
  setLoading(true);
  const response = await fetch('/api/import', {
    method: 'POST',
    body: JSON.stringify({
      wpUrl: 'https://tu-blog-de-wp.com', // El valor del input
      accessToken: process.env.NEXT_PUBLIC_TNU_TOKEN, // O de donde lo recuperes
      storeId: '123456' 
    })
  });
  
  const data = await response.json();
  console.log('Importación terminada:', data.detail);
  setLoading(false);
};
