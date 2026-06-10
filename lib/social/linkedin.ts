// LinkedIn publishing adapter stub for local development.
export async function publishLinkedInPost(body: string) {
  return { id: `mock-linkedin-${Date.now()}`, body };
}
