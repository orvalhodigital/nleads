fetch('https://wdapi2.com.br/consulta/PQQ4A24/d7c110609b272abfbf7e3d1d97fcefdf')
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
