// Facebook publishing adapter stub for local development.
export async function publishFacebookPost(body: string) {
  return { id: `mock-facebook-${Date.now()}`, body };
}
