// Instagram publishing adapter stub for local development.
export async function publishInstagramPost(body: string) {
  return { id: `mock-instagram-${Date.now()}`, body };
}
