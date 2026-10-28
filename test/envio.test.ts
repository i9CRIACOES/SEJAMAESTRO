import { afterEach, describe, expect, it, vi } from 'vitest';
import { registrarAssessment } from '../src/assessment/envio';
import { payloadDiagnostico } from '../src/assessment/calc';

const payload = payloadDiagnostico({nome:'Teste',email:'teste@example.invalid',cel:'',empresa:'',setor:'Varejo'}, Array.from({length:5},()=>[5,5,5,5]),2500);
afterEach(()=>vi.unstubAllGlobals());
describe('recuperação do envio',()=>{
  it('preserva erro de validação e permite reenviar após correção',async()=>{
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({erro:'Informe um e-mail válido.'}),{status:422}))
      .mockResolvedValueOnce(new Response(JSON.stringify({ok:true,id:'abc',notificado:false}),{status:201}));
    vi.stubGlobal('fetch',fetchMock);
    await expect(registrarAssessment(payload,false)).rejects.toThrow('Informe um e-mail válido.');
    await expect(registrarAssessment(payload,false)).resolves.toEqual({id:'abc',notificado:false});
  });
  it('não interpreta indisponibilidade ou resposta inválida como sucesso',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({erro:'Envio automático indisponível.'}),{status:503})).mockResolvedValueOnce(new Response('<html>erro</html>',{status:502})));
    await expect(registrarAssessment(payload,false)).rejects.toThrow('Envio automático indisponível.');
    await expect(registrarAssessment(payload,false)).rejects.toThrow('Tente novamente');
  });
  it('explica falhas de conexão sem bloquear uma nova tentativa',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new TypeError('network')));
    await expect(registrarAssessment(payload,false)).rejects.toThrow('Confira sua conexão');
  });
});
