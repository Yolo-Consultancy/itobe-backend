export function buildPasswordResetEmail({ prenom = "", resetUrl }) {
  const salutation = prenom?.trim() ? `Bonjour ${prenom.trim()},` : "Bonjour,";

  const subject = "Réinitialisation de votre mot de passe Itobe";

  const text = [
    salutation,
    "",
    "Vous avez demandé la réinitialisation de votre mot de passe Itobe.",
    "Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :",
    "",
    resetUrl,
    "",
    "Ce lien expire dans 1 heure.",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    "",
    "— L'équipe Itobe",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f4;font-family:Georgia,'Times New Roman',serif;color:#1c1917;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:4px;overflow:hidden;">
            <tr>
              <td style="background:#1c1917;padding:24px 28px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="width:36px;height:36px;background:#d99b4f;text-align:center;vertical-align:middle;font-weight:700;font-size:18px;color:#1c1917;">I</td>
                    <td style="padding-left:12px;font-size:22px;letter-spacing:0.08em;color:#fafaf9;">ITOBE</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#44403c;">
                <p style="margin:0 0 16px;">${salutation}</p>
                <p style="margin:0 0 16px;">
                  Vous avez demandé la réinitialisation de votre mot de passe Itobe.
                  Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
                </p>
                <p style="margin:24px 0;text-align:center;">
                  <a href="${resetUrl}" style="display:inline-block;background:#d99b4f;color:#1c1917;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:4px;">
                    Réinitialiser mon mot de passe
                  </a>
                </p>
                <p style="margin:0 0 16px;font-size:13px;color:#78716c;">
                  Ce lien expire dans <strong>1 heure</strong>.
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                </p>
                <p style="margin:0 0 16px;word-break:break-all;font-size:12px;color:#57534e;">
                  <a href="${resetUrl}" style="color:#d97706;">${resetUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;color:#78716c;">
                  Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#fafaf9;border-top:1px solid #e7e5e4;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a8a29e;">
                © ${new Date().getFullYear()} Itobe Entreprise
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
