interface InvitationEmailProps {
  inviteeName: string;
  inviterName: string;
  tenantName: string;
  role: 'ADMIN' | 'SUPERVISOR';
  acceptUrl: string;
  expiresInDays: number;
}

export function buildInvitationEmailHtml({
  inviterName,
  tenantName,
  role,
  acceptUrl,
  expiresInDays,
}: InvitationEmailProps): string {
  const roleLabel = role === 'ADMIN' ? 'Administrador' : 'Operativo';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación a Seedor</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#16a34a;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🌱 Seedor
              </h1>
              <p style="margin:8px 0 0;color:#dcfce7;font-size:14px;">
                Gestión Agropecuaria Inteligente
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:600;">
                ¡Te invitaron a unirte!
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                <strong style="color:#111827;">${inviterName}</strong> te invitó a unirte a
                <strong style="color:#111827;">${tenantName}</strong> en Seedor como
                <strong style="color:#16a34a;">${roleLabel}</strong>.
              </p>

              <!-- Role explanation -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#166534;font-size:13px;line-height:1.5;">
                      ${
                        role === 'ADMIN'
                          ? '🔑 Como <strong>Administrador</strong>, tendrás acceso completo a todas las funcionalidades, incluyendo gestión de usuarios, configuración y ventas.'
                          : '👤 Como usuario <strong>Operativo</strong>, tendrás acceso a las herramientas de campo, inventario, trabajadores y más.'
                      }
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${acceptUrl}" target="_blank" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#9ca3af;font-size:13px;text-align:center;">
                Este enlace expira en ${expiresInDays} días.
              </p>

              <!-- Fallback URL -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">
                      Si el botón no funciona, copiá y pegá este enlace:
                    </p>
                    <p style="margin:0;color:#16a34a;font-size:12px;word-break:break-all;">
                      ${acceptUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} Seedor. Todos los derechos reservados.
              </p>
              <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;">
                Si no esperabas esta invitación, podés ignorar este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildInvitationEmailText({
  inviterName,
  tenantName,
  role,
  acceptUrl,
  expiresInDays,
}: InvitationEmailProps): string {
  const roleLabel = role === 'ADMIN' ? 'Administrador' : 'Operativo';
  return [
    `¡Te invitaron a unirte a Seedor!`,
    ``,
    `${inviterName} te invitó a unirte a ${tenantName} como ${roleLabel}.`,
    ``,
    `Aceptá la invitación haciendo click en el siguiente enlace:`,
    acceptUrl,
    ``,
    `Este enlace expira en ${expiresInDays} días.`,
    ``,
    `Si no esperabas esta invitación, podés ignorar este email.`,
    ``,
    `© ${new Date().getFullYear()} Seedor`,
  ].join('\n');
}
