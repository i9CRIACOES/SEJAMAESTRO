import type { payloadDiagnostico } from './calc';

/** Reject errors so the contact gate remains editable and can be submitted again. */
export async function registrarAssessment(payload: ReturnType<typeof payloadDiagnostico>, isca: boolean) {
  let resp: Response;
  try {
    resp = await fetch('/api/assessment.php', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...payload, isca: isca ? 'preenchido' : ''}),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error('Não foi possível conectar. Confira sua conexão e tente novamente.');
  }
  const dados = await resp.json().catch(() => null);
  if (!resp.ok || !dados?.ok) {
    throw new Error(typeof dados?.erro === 'string' ? dados.erro : 'Não foi possível gravar. Tente novamente.');
  }
  return {id: String(dados.id || 'recebido'), notificado: dados.notificado === true};
}
