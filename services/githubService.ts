import { Octokit } from '@octokit/rest';

export const getOctokit = (token?: string) => {
  // Prioritize user provided token, fallback to env var
  const authToken = token || process.env.GITHUB_TOKEN;
  
  if (!authToken) {
    throw new Error("GitHub Token is required to fetch repository data.");
  }
  return new Octokit({ auth: authToken });
};

/**
 * Fetches the complete file tree of a repository.
 * This is crucial for giving the AI context about the project structure.
 */
export const getRepoFileTree = async (owner: string, repo: string, branch: string = 'main', token?: string): Promise<string[]> => {
  try {
    const octokit = getOctokit(token);

    // Get the reference to the branch (to get the latest commit SHA)
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const sha = refData.object.sha;

    // Get the tree recursively
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: 'true',
    });

    // Filter to keep only blobs (files) and meaningful paths
    // Excluding node_modules, .git, etc. to save context window
    const files = treeData.tree
      .filter((item) => item.type === 'blob')
      .map((item) => item.path)
      .filter((path) => path && !path.startsWith('.git') && !path.includes('node_modules') && !path.includes('package-lock.json'));

    return files as string[];
  } catch (error: any) {
    console.warn("Failed to fetch repo tree:", error);
    return []; // Return empty array gracefully so the app doesn't crash, AI just has less context
  }
};