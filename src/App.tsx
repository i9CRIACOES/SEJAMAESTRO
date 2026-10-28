import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUpRight, CalendarCheck, Check, Send } from 'lucide-react';
import { calcularAssessment, linkEmail, moeda, payloadDiagnostico, resumoTexto, status, type ContatoAssessment } from './assessment/calc';
import { MODULOS, NOTA_METODO, RECEITAS, SETORES } from './assessment/data';
import { Radar } from './assessment/Radar';

const COR = { ok: 'text-ok', warn: 'text-warn', err: 'text-err' };
const initial = () => MODULOS.map(() => [5, 5, 5, 5]);
const formClass = 'mt-2 w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-base text-offwhite outline-none focus:border-ciano';
export default function App() {
  const [scores, setScores] = useState(initial);
  const [receita, setReceita] = useState(2500);
  const [contato, setContato] = useState<ContatoAssessment>({ nome: '', cel: '', email: '', empresa: '', setor: 'Varejo' });
  const [tabela, setTabela] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [falha, setFalha] = useState<string | null>(null);
  const [isca, setIsca] = useState('');
  const r = useMemo(() => calcularAssessment(scores, receita), [scores, receita]);
  const st = status(r.geral);
  const payload = payloadDiagnostico(contato, scores, receita);
  const mudarContato = (key: keyof ContatoAssessment, value: string) => { setContato(c => ({ ...c, [key]: value })); setEnviado(null); setFalha(null); };
  const mudarNota = (i: number, j: number, v: number) => { setScores(s => s.map((a, k) => k === i ? a.map((n, p) => p === j ? v : n) : a)); setEnviado(null); setFalha(null); };
  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (enviando) return; setEnviando(true); setFalha(null);
    try {
      const resp = await fetch('/api/assessment.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, isca }), signal: AbortSignal.timeout(20000) });
      const dados = await resp.json();
      if (!resp.ok || !dados.ok) throw new Error('Não foi possível gravar automaticamente.');
      setEnviado(dados.id || 'recebido');
      if (!dados.notificado) setFalha('Seu diagnóstico foi gravado, mas a notificação à equipe não foi confirmada. Use seu aplicativo de e-mail para encaminhar o resumo.');
    } catch { setFalha('Não foi possível gravar automaticamente. Você pode tentar novamente ou enviar o resumo pelo seu aplicativo de e-mail.'); }
    finally { setEnviando(false); }
  };
  return <div>
    <a href="#diagnostico" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:p-4">Ir para o diagnóstico</a>
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-7 md:px-10">
      <a href="/" aria-label="Maestro — início"><img src="/maestro-wordmark.svg" className="h-10 w-40" alt="Maestro" /></a>
      <a href="#envio" className="inline-flex items-center gap-2 text-sm font-bold text-ciano">Enviar diagnóstico <ArrowDown className="size-4" aria-hidden /></a>
    </header>
    <main className="mx-auto max-w-7xl px-5 pb-20 md:px-10">
      <section className="grid items-center gap-6 pb-12 pt-8 md:grid-cols-[1fr_240px] md:pb-16 md:pt-12">
        <div><h1 className="max-w-4xl text-balance text-4xl font-extrabold leading-[1.07] tracking-tight md:text-6xl">Onde está a sua maior dor de decisão?</h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">Avaliação por módulo do Maestro — Flow, Insights, Teams, Composer e CX. Responda por área: o radar aponta, com clareza, onde o valor mais escapa hoje e qual capacidade o estanca. Ajuste os controles; recalcula em tempo real.</p>
        </div>
        <img src="/robo.png" alt="" className="mx-auto hidden max-h-64 w-52 object-contain md:block" />
      </section>
      <form id="envio" onSubmit={enviar}>
        <fieldset disabled={enviando} className="min-w-0">
        <section aria-labelledby="perfil-t" className="border-y border-white/12 py-8">
          <h2 id="perfil-t" className="text-xl font-extrabold">Seu contexto</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {([['nome', 'Nome', 'text', 'name'], ['cel', 'Celular', 'tel', 'tel'], ['email', 'E-mail', 'email', 'email'], ['empresa', 'Empresa', 'text', 'organization']] as const).map(([key, label, type, autoComplete]) => <label key={key} className="text-sm font-bold">{label}{(key === 'nome' || key === 'email') && <span className="ml-1 text-warn" aria-label="obrigatório">*</span>}
              <input name={key} type={type} autoComplete={autoComplete} required={key === 'nome' || key === 'email'} maxLength={key === 'email' ? 254 : 120} value={contato[key]} onChange={e => mudarContato(key, e.target.value)} className={formClass} />
            </label>)}
            <label className="text-sm font-bold">Setor<select value={contato.setor} onChange={e => mudarContato('setor', e.target.value)} className={formClass}>{SETORES.map(s => <option key={s}>{s}</option>)}</select></label>
            <label className="text-sm font-bold">Faixa de receita anual<select value={receita} onChange={e => { setReceita(+e.target.value); setEnviado(null); setFalha(null); }} className={formClass}>{RECEITAS.map(f => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}</select></label>
          </div>
          <input aria-hidden tabIndex={-1} name="ref_url_x" value={isca} onChange={e => setIsca(e.target.value)} autoComplete="off" className="absolute -left-[9999px] h-0 w-0" />
        </section>
        <div id="diagnostico" className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-2xl font-extrabold md:text-3xl">Diagnóstico por módulo</h2><button type="button" onClick={() => setTabela(v => !v)} aria-expanded={tabela} aria-controls="tabela-modulos" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold hover:border-ciano">{tabela ? 'Ocultar tabela' : 'Ver como tabela'}</button></div>
            <p className="mt-3 max-w-xl text-muted-foreground">4 perguntas por módulo. Dê uma nota de 0 a 10: quanto maior, menos valor vaza.</p>
            {tabela && <div id="tabela-modulos" className="mt-6 overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><caption className="sr-only">Maturidade por módulo</caption><thead><tr><th scope="col" className="py-3">Módulo</th><th scope="col">Nota</th><th scope="col">Situação</th><th scope="col">Áreas</th></tr></thead><tbody>{MODULOS.map((m, i) => <tr key={m.nome} className="border-t border-white/10"><th scope="row" className="py-4 pr-4">{m.nome}</th><td className="pr-4">{r.notas[i].toFixed(1)}</td><td className={COR[status(r.notas[i]).nivel]}>{status(r.notas[i]).texto}</td><td className="pl-4 text-muted-foreground">{m.areas.join(' · ')}</td></tr>)}</tbody></table></div>}
            {MODULOS.map((m, i) => <section key={m.nome} id={`modulo-${m.nome}`} aria-labelledby={`modulo-${i}-t`} className="border-b border-white/12 py-10 first:pt-0">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 id={`modulo-${i}-t`} className="text-2xl font-extrabold">Maestro {m.nome}</h3><p className="mt-1 text-muted-foreground">{m.subtitulo}</p></div><p className={`text-right text-sm font-bold ${COR[status(r.notas[i]).nivel]}`}><span className="block text-3xl font-extrabold tabular-nums">{r.notas[i].toFixed(1)}<span className="text-sm text-muted-foreground">/10</span></span>{status(r.notas[i]).texto}</p></div>
              <div className="mt-8 grid gap-7">{m.perguntas.map((q, j) => <div key={q}><div className="flex items-start justify-between gap-5"><label htmlFor={`nota-${i}-${j}`} className="max-w-xl text-base leading-relaxed">{q}</label><output htmlFor={`nota-${i}-${j}`} className="min-w-8 text-right text-xl font-extrabold tabular-nums text-ciano">{scores[i][j]}</output></div><input id={`nota-${i}-${j}`} aria-label={`${m.nome} pergunta ${j + 1}`} type="range" min="0" max="10" step="1" value={scores[i][j]} onChange={e => mudarNota(i, j, +e.target.value)} className="assessment-range mt-3 w-full" /><div aria-hidden className="flex justify-between text-xs text-muted-foreground"><span>0 · Ainda não acontece</span><span>10 · Sob controle</span></div></div>)}</div>
              <p className="mt-7 text-sm font-bold text-ciano">{m.areas.join(' · ')}</p><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{m.prova}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{m.fonte}</p>
            </section>)}
          </div>
          <aside aria-label="Seu resultado em tempo real" className="order-first self-start lg:sticky lg:top-6 lg:order-last">
            <div className="rounded-2xl bg-navy p-6"><h2 className="text-xl font-extrabold">Radar de maturidade</h2><Radar notas={r.notas} /><dl className="grid gap-3">{MODULOS.map((m, i) => <div key={m.nome} className="flex items-center justify-between gap-5"><dt><a href={`#modulo-${m.nome}`} className="hover:text-ciano">{m.nome}</a></dt><dd className={`font-bold tabular-nums ${COR[status(r.notas[i]).nivel]}`}>{r.notas[i].toFixed(1)}/10</dd></div>)}</dl></div>
            <div className="px-1 py-7"><h2 className="text-lg font-extrabold">Sua maior dor está em</h2><p className="mt-2 text-4xl font-extrabold text-ciano">Maestro {r.modulo.nome}</p><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{r.modulo.subtitulo}: é aqui que a decisão trava e o valor escapa primeiro (nota {r.notas[r.pior].toFixed(1)}). Resolve desafios de {r.modulo.areas.join(', ')}.</p>{r.gargalo && <p className="mt-4 text-sm leading-relaxed text-warn">A média geral ({r.geral.toFixed(1)}) mascara este gargalo — e é exatamente por aqui que o Maestro entra primeiro.</p>}
              <p className={`mt-6 text-base font-bold ${COR[st.nivel]}`}>{st.banda} ({r.geral.toFixed(1)}/10)</p><p className="mt-5 text-sm text-muted-foreground">Valor estimado em risco</p><p className="mt-1 text-3xl font-extrabold tabular-nums">{moeda(r.riscoAno)}<span className="text-base font-medium text-muted-foreground">/ano</span></p><p className="mt-2 text-xs text-muted-foreground">Aproximadamente {(r.pct * 100).toFixed(0)}% da receita de referência.*</p>
            </div>
          </aside>
        </div>
        <section aria-labelledby="rota-t" className="rounded-2xl bg-navy px-6 py-8 md:p-10"><h2 id="rota-t" className="text-2xl font-extrabold md:text-3xl">Rota recomendada</h2><p className="mt-5 text-xl font-extrabold text-ciano">Prioridade #1 — Maestro {r.modulo.nome}</p><p className="mt-4 max-w-3xl text-lg leading-relaxed">{r.modulo.rota}</p><p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">Depois, expanda como sistema: os 5 módulos operam como uma inteligência contínua, sobre o stack que você já tem.</p></section>
        <section aria-labelledby="enviar-t" className="grid items-start gap-8 border-b border-white/12 py-12 md:grid-cols-2 md:gap-16"><div><h2 id="enviar-t" className="text-2xl font-extrabold">Enviar meu diagnóstico</h2><p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">Gravamos o resultado — notas por módulo, maior dor e valor em risco — para acompanhamento. Confira nome, celular e e-mail no topo antes de enviar.</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Ao enviar, seus dados e o diagnóstico são encaminhados à equipe Always On para acompanhamento.</p></div><div><button type="submit" disabled={enviando || !!enviado} aria-busy={enviando} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-ciano px-6 font-extrabold text-ink transition-colors hover:bg-offwhite disabled:cursor-wait disabled:opacity-60">{enviado ? <Check className="size-5" aria-hidden /> : <Send className="size-5" aria-hidden />}{enviando ? 'Enviando…' : enviado ? 'Diagnóstico gravado' : 'Enviar meu diagnóstico'}</button>
          {enviado && <p role="status" className="mt-4 break-words text-sm text-ok">Resultado gravado com sucesso (código {enviado}).</p>}
          {falha && <div role="alert" className="mt-5"><p className="text-sm leading-relaxed text-warn">{falha}</p><a href={linkEmail(payload)} className="mt-4 inline-flex items-center gap-2 font-bold text-ciano underline underline-offset-4">Enviar pelo meu e-mail <ArrowUpRight className="size-4" aria-hidden /></a><label className="mt-5 block text-sm font-bold">Ou copie o resumo<textarea readOnly value={resumoTexto(payload)} rows={8} className={`${formClass} text-sm font-normal`} onFocus={e => e.target.select()} /></label></div>}
        </div></section>
        </fieldset>
      </form>
      <section className="grid items-center gap-6 py-12 md:grid-cols-[1fr_auto]"><div><h2 className="text-2xl font-extrabold md:text-3xl">Da leitura à próxima decisão.</h2><p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">Este assessment mostrou onde o valor escapa. A Sessão Executiva mostra quanto dá para recuperar — e por onde começar, com governança e sem trocar o seu stack.</p></div><a href="https://calendly.com/elcio-santos/30min" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-ciano px-5 font-bold text-ciano hover:bg-ciano/10"><CalendarCheck className="size-5" aria-hidden />Agendar Sessão Executiva</a></section>
      <footer className="border-t border-white/12 pt-8"><p className="max-w-5xl text-xs leading-relaxed text-muted-foreground">* {NOTA_METODO}</p><img src="/maestro-wordmark.svg" alt="Maestro" className="mt-8 h-8 w-36" /></footer>
    </main>
  </div>;
}
