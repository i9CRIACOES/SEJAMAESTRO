import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const privado = mkdtempSync(path.join(tmpdir(), 'sejamaestro-test-'));
writeFileSync(path.join(privado, 'config.php'), "<?php return ['habilitado'=>true,'url'=>'http://127.0.0.1:4182','remetente'=>''];");
const servidor = spawn(process.env.PHP_BINARY || 'php', ['-S','127.0.0.1:4182','-t','dist'], { env:{...process.env,SEJAMAESTRO_PRIVATE_DIR:privado}, stdio:'ignore' });
try {
  const base = 'http://127.0.0.1:4182/api/assessment.php';
  for (let i=0;i<30;i++) { try { await fetch(base); break; } catch { await new Promise(r=>setTimeout(r,100)); } }
  const dados = {nome:'Teste Local',email:'teste@example.invalid',cel:'',empresa:'Teste',setor:'Varejo',receita:2500,modulos:Array.from({length:5},()=>({respostas:[5,5,5,5]})),valorEmRiscoAno:1};
  const enviar = (v,origin='http://127.0.0.1:4182') => fetch(base,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(v)});
  assert.equal((await fetch(base)).status,405);
  assert.equal((await enviar(dados,'https://outro.example')).status,403);
  assert.equal((await enviar({...dados,email:'invalido'})).status,422);
  const response = await enviar(dados);
  assert.equal(response.status,201);
  const resultado = await response.json();
  assert.equal(resultado.ok,true); assert.equal(resultado.notificado,false);
  const salvo = JSON.parse(readFileSync(path.join(privado,'respostas',resultado.id+'.json'),'utf8'));
  assert.equal(salvo.valorEmRiscoAno,437500000); assert.equal(salvo.maiorDor,'Flow');
  const privadoHttp = await fetch('http://127.0.0.1:4182/.sejamaestro/respostas/'+resultado.id+'.json');
  // O servidor PHP no Linux pode devolver index.html como fallback de uma rota ausente.
  assert.notEqual(privadoHttp.headers.get('content-type')?.split(';')[0], 'application/json');
  assert.equal((await privadoHttp.text()).includes('teste@example.invalid'), false);
  for(let i=0;i<5;i++) assert.equal((await enviar(dados)).status,201);
  assert.equal((await enviar(dados)).status,429);
  console.log('Integração HTTP passou: origem, validação, gravação privada, recálculo e limite. Nenhum e-mail enviado.');
} finally { servidor.kill(); rmSync(privado,{recursive:true,force:true}); }
