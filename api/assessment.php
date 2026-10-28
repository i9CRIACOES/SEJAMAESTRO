<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function responderAssessment(int $status, array $dados): void { http_response_code($status); echo json_encode($dados, JSON_UNESCAPED_UNICODE); exit; }
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') responderAssessment(405, ['erro' => 'Método não permitido.']);
    umask(0077);
    $dir = getenv('SEJAMAESTRO_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/.sejamaestro';
    $config = is_file($dir . '/config.php') ? require $dir . '/config.php' : [];
    if (!($config['habilitado'] ?? false)) responderAssessment(503, ['erro' => 'Envio automático indisponível.']);
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== rtrim($config['url'] ?? 'https://sejamaestro.aodigital.net.br', '/')) responderAssessment(403, ['erro' => 'Origem não permitida.']);
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) responderAssessment(415, ['erro' => 'Formato inválido.']);
    $raw = file_get_contents('php://input', false, null, 0, 16385);
    if (strlen($raw) > 16384) responderAssessment(413, ['erro' => 'Solicitação muito grande.']);
    $v = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    if (!is_array($v)) responderAssessment(400, ['erro' => 'Dados inválidos.']);
    require __DIR__ . '/assessment-core.php';
    $dados = validarAssessment($v);
    if (!empty($v['isca'])) responderAssessment(202, ['ok' => true, 'id' => 'recebido']);
    $destino = $dir . '/respostas';
    if (!is_dir($destino) && !mkdir($destino, 0700, true) && !is_dir($destino)) throw new RuntimeException('storage');
    if (!limitarAssessment($destino, $_SERVER['REMOTE_ADDR'] ?? '', time())) responderAssessment(429, ['erro' => 'Aguarde alguns minutos antes de enviar novamente.']);
    $id = bin2hex(random_bytes(16));
    if (file_put_contents($destino . '/' . $id . '.json', json_encode($dados, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), LOCK_EX) === false) throw new RuntimeException('storage');
    $from = $config['remetente'] ?? '';
    $notificado = false;
    if (filter_var($from, FILTER_VALIDATE_EMAIL) && !preg_match('/[\r\n]/', $from)) {
        $mensagem = 'Novo diagnóstico Maestro (' . $id . ")\n\n" . json_encode($dados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $notificado = mail('elcio@aodigital.com.br', '=?UTF-8?B?' . base64_encode('Novo diagnóstico Seja Maestro') . '?=', $mensagem, ['From' => $from, 'Reply-To' => $dados['email'], 'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8']);
    }
    responderAssessment(201, ['ok' => true, 'id' => $id, 'notificado' => $notificado]);
} catch (InvalidArgumentException $e) { responderAssessment(422, ['erro' => $e->getMessage()]); }
catch (JsonException $e) { responderAssessment(400, ['erro' => 'Dados inválidos.']); }
catch (Throwable $e) { error_log('Seja Maestro: ' . get_class($e)); responderAssessment(503, ['erro' => 'Não foi possível gravar automaticamente.']); }
