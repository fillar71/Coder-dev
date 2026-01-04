export const INITIAL_ROUTE_CODE = `import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    const { file_path, new_content, commit_message } = body;

    // Validate input
    if (!file_path || !new_content || !commit_message) {
      return NextResponse.json(
        { error: 'Missing required fields: file_path, new_content, commit_message' },
        { status: 400 }
      );
    }

    // Get GitHub Token from environment variables
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Missing GITHUB_TOKEN environment variable' },
        { status: 500 }
      );
    }

    // Initialize Octokit
    const octokit = new Octokit({ auth: token });

    // Configuration - You might want to move these to env vars as well
    const OWNER = process.env.GITHUB_OWNER || 'your-username';
    const REPO = process.env.GITHUB_REPO || 'your-repo';

    // 1. Check if the file already exists to get its SHA (required for updates)
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: file_path,
      });

      // Ensure it's a file, not a directory
      if (!Array.isArray(data) && data.sha) {
        sha = data.sha;
      }
    } catch (error: any) {
      // If 404, the file doesn't exist yet, which is fine for creation
      if (error.status !== 404) {
        throw error;
      }
    }

    // 2. Create or Update the file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: file_path,
      message: commit_message,
      // GitHub API expects content in Base64
      content: Buffer.from(new_content).toString('base64'),
      sha, // Include SHA if updating, undefined if creating
    });

    return NextResponse.json({
      success: true,
      data: response.data.commit,
      message: sha ? 'File updated' : 'File created',
    });

  } catch (error: any) {
    console.error('GitHub Commit Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
`;
