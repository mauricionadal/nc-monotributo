// Función serverless de Vercel (no se ejecuta en el navegador del cliente).
// La clave ANTHROPIC_API_KEY se configura en Vercel → Project Settings → Environment Variables.
// Nunca se expone en el código del sitio.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar ANTHROPIC_API_KEY en Vercel.' });
    return;
  }

  const { nombre, tipoActividad, categoriaActual, categoriaObjetivo, cuotaTotal, alertas } = req.body || {};

  const prompt = `Sos un asistente de gestión de un estudio contable argentino (NC Servicios Integrales), que redacta sugerencias automáticas para monotributistas dentro de un panel de autogestión, sin que un profesional revise cada caso.

Datos del contribuyente:
- Actividad: ${tipoActividad === 'servicios' ? 'Locación y/o prestación de servicios' : 'Venta de cosas muebles'}
- Categoría actual: ${categoriaActual}
- Categoría proyectada: ${categoriaObjetivo}
- Monto mensual total del monotributo: ${Math.round(cuotaTotal || 0)} pesos argentinos
- Alertas activas: ${alertas && alertas.length ? alertas.join(', ') : 'ninguna'}

Escribí en español rioplatense, tono profesional y cercano, máximo 170 palabras, sin markdown ni títulos. Estructura en tres partes fluidas:
1) Un diagnóstico breve de su situación de categorización y carga tributaria mensual.
2) Dos o tres sugerencias GENERALES de gestión (instrumentos de bajo riesgo a evaluar, tipo de financiamiento típico para esa categoría, hábitos de facturación). Sin nombrar bancos ni productos específicos.
3) Un cierre aclarando que es una sugerencia automática y orientativa, y que para una decisión concreta conviene contactar al estudio.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'Error de la API de Claude', detail: errText });
      return;
    }

    const data = await response.json();
    const text = (data.content || []).map((b) => b.text || '').join('\n').trim();
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo generar la recomendación', detail: String(e) });
  }
}
