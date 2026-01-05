import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Octokit } from '@octokit/rest';
import { Buffer } from 'node:buffer';

// This function runs on the server (Vercel Serverless Function)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { file_path, new_content, commit_message } = req.body;

    if (!file_path || !new_content || !commit_message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Retrieve sensitive tokens from Environment Variables (Server-side only)
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'Server configuration error: Missing GitHub credentials.' });
    }

    const octokit = new Octokit({ auth: token });

    // 1. Check if file exists to get SHA (needed for updates)
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file_path,
      });

      // @ts-ignore - Octokit types are complex, assuming file response
      if (data && !Array.isArray(data) && data.sha) {
        sha = data.sha;
      }
    } catch (error: any) {
      // If 404, file doesn't exist, which is fine for creation
      if (error.status !== 404) {
        console.error('Error checking file:', error);
      }
    }

    // 2. Create or Update file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file_path,
      message: commit_message,
      content: Buffer.from(new_content).toString('base64'),
      sha, // Include SHA if updating
    });

    return res.status(200).json({
      success: true,
      message: sha ? 'File updated successfully' : 'File created successfully',
      html_url: response.data.commit.html_url
    });

  } catch (error: any) {
    console.error('Commit Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to commit to GitHub' 
    });
  }
}
