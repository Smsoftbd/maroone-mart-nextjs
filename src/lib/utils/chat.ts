/** Messenger link for a Facebook page URL (facebook.com/<page> → m.me/<page>). */
export function messengerUrl(facebook?: string, whatsapp?: string): string | undefined {
  if (facebook) {
    const page = facebook.replace(/^https?:\/\/(www\.|m\.)?(facebook|fb)\.com\//i, "").split(/[/?#]/)[0];
    if (page && !/^https?:/i.test(page) && page !== "profile.php") return `https://m.me/${page}`;
    return facebook;
  }
  if (whatsapp) return /^https?:/i.test(whatsapp) ? whatsapp : `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
  return undefined;
}
