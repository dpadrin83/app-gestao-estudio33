function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif;color:#e8e8e8;padding:32px 16px">
  <div style="max-width:520px;margin:0 auto">
    <p style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888;margin:0 0 24px">Hub · Estúdio 33</p>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#666">Estúdio 33 — gestão de projetos</p>
  </div>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<p style="margin:28px 0"><a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">${label}</a></p>`;
}

export function portalInviteEmail(opts: {
  clientName: string;
  actionLink: string;
}): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Acesso ao portal</h1>
    <p style="color:#aaa;line-height:1.6;margin:0">Olá! Você foi convidado(a) a acompanhar os projetos da <strong>${opts.clientName}</strong> no portal do Estúdio 33.</p>
    <p style="color:#aaa;line-height:1.6;margin:16px 0 0">Clique no botão abaixo para definir sua senha e entrar:</p>
    ${btn(opts.actionLink, "Acessar o portal")}
    <p style="font-size:12px;color:#666;line-height:1.5">Se o botão não funcionar, copie e cole este link no navegador:<br><span style="word-break:break-all;color:#888">${opts.actionLink}</span></p>
  `);
}

export function deliverableSentEmail(opts: {
  clientName: string;
  projectName: string;
  deliverableName: string;
  portalUrl: string;
}): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Novo entregável para revisão</h1>
    <p style="color:#aaa;line-height:1.6;margin:0">Olá! Há um novo material disponível no projeto <strong>${opts.projectName}</strong>:</p>
    <p style="color:#e8e8e8;font-size:16px;font-weight:600;margin:16px 0">${opts.deliverableName}</p>
    ${btn(opts.portalUrl, "Ver no portal")}
    <p style="font-size:12px;color:#666">Você pode aprovar, solicitar ajustes ou comentar diretamente na área do cliente.</p>
  `);
}

export function deliverableReviewedEmail(opts: {
  clientName: string;
  projectName: string;
  deliverableName: string;
  decision: "approved" | "rejected";
  projectUrl: string;
}): string {
  const label = opts.decision === "approved" ? "aprovou" : "solicitou ajustes em";
  return layout(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Resposta do cliente</h1>
    <p style="color:#aaa;line-height:1.6;margin:0"><strong>${opts.clientName}</strong> ${label} o entregável <strong>${opts.deliverableName}</strong> (${opts.projectName}).</p>
    ${btn(opts.projectUrl, "Abrir no Hub")}
  `);
}

export function passwordResetEmail(opts: { actionLink: string }): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:700;margin:0 0 12px">Redefinir senha</h1>
    <p style="color:#aaa;line-height:1.6;margin:0">Recebemos um pedido para redefinir a senha da sua conta no Hub Estúdio 33.</p>
    ${btn(opts.actionLink, "Criar nova senha")}
    <p style="font-size:12px;color:#666">Se você não pediu isso, ignore este e-mail.</p>
  `);
}
