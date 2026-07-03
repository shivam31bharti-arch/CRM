export function readMetaGraphApiVersion(env?: { META_GRAPH_API_VERSION?: string }) {
  const version = (env?.META_GRAPH_API_VERSION ?? process.env.META_GRAPH_API_VERSION)?.trim();
  if (!version) {
    throw new Error("META_GRAPH_API_VERSION is required to publish to Meta platforms.");
  }
  if (!/^v\d{1,3}\.\d{1,2}$/.test(version)) {
    throw new Error("META_GRAPH_API_VERSION must use the vNN.N format.");
  }
  return version;
}
