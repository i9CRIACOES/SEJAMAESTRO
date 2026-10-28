# Seja Maestro

Assessment com a identidade visual Maestro e conteúdo do artefato autorizado. Cinco módulos, vinte notas de 0 a 10, radar, maior dor, valor em risco, rota e link original de agendamento.

A interface reutiliza os componentes da Fábrica de soluções aprovada nas versões Acompanhado e Sozinho: portão com robô, estações, trilho lateral, mapa mobile, esteira, navegação e cofre. São seis estações: contexto e cinco módulos. Cada estação exige confirmação explícita; as notas iniciais podem ser mantidas. O painel usa os mesmos cartões industriais do resultado aprovado. As vinte perguntas e as fórmulas permanecem as do artefato. Após desbloquear, os dados da avaliação ficam bloqueados para manter o resultado igual ao registro enviado.

As notas de cada módulo são médias simples e a maturidade geral é a média dos cinco módulos. Empates priorizam o primeiro módulo. Limiares: 3 e 7. Referências de receita: R$300 milhões, R$750 milhões e R$2,5 bilhões. Risco: receita × (5% + (10 − maturidade) / 10 × 25%). São estimativas do método do artefato.

## Verificar

Node22 e PHP8.0 ou superior: `npm ci`, `npm test`, `npm run build`, `php test/api.php`, `node scripts/testar-api.mjs`. O teste HTTP é local, com remetente vazio, sem enviar e-mail.

## Publicar

Actions gera a branch `deploy`. Conecte-a no Git do Plesk com destino `sejamaestro.aodigital.net.br`. Publique somente dist: index.html, assets e api. Ative PHP. Copie server/config.example.php para um diretório fora da raiz pública e configure SEJAMAESTRO_PRIVATE_DIR para esse caminho. O padrão é o diretório pai da raiz do site mais `/.sejamaestro`. O usuário PHP precisa de escrita e os dados não podem ser servidos por HTTP.

Ative habilitado após configurar armazenamento e HTTPS. Um remetente autorizado habilita a notificação ao endereço de equipe original do artefato. Sem notificação confirmada, a interface confirma apenas o armazenamento e oferece encaminhamento pelo aplicativo de e-mail e resumo para copiar. O participante não recebe e-mail automaticamente nesta versão.

A API recalcula resultados e limita envios. Respostas privadas não entram no Git nem no deploy. Defina rotina de retenção e consulta operacional desses registros. Verifique armazenamento e notificação antes da divulgação pública.

O webhook GitHub → Plesk acompanha a branch deploy. Cada push em main passa pelo CI e gera o build; version.json expõe somente o SHA de origem para verificar a publicação.

Para reverter, reverta em main e publique o novo build após CI. Confira o commit no Plesk e na URL. Os registros privados permanecem fora do deploy.

Na revisão final, falhas de rede ou validação mantêm o formulário editável e permitem repetir o envio. O diagnóstico pode ser consultado sem gravação, com aviso explícito e retorno ao formulário. Opções suportam setas/Home/End, os controles anunciam o enunciado completo e têm área de toque de 44px.
