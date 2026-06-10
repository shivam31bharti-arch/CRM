// Twitter/X publishing adapter stub for local development.
export async function publishTwitterPost(body: string) {
  return { id: `mock-twitter-${Date.now()}`, body };
}
