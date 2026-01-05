import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { Buffer } from 'node:buffer';

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { file_path, new_content, commit_message } = body;

    // Validasi input
    if (!file_path || !new_content || !commit_message) {
      return NextResponse.json(
        { error: 'Missing required fields: file_path, new_content, commit_message' },
        { status: 400 }
      );
    }

    // Ambil Token GitHub dari Environment Variable
    // Catatan: Dalam produksi, pastikan token ini aman atau gunakan sesi pengguna
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing GitHub credentials.' },
        { status: 500 }
      );
    }

    // Inisialisasi Octokit
    const octokit = new Octokit({ auth: token });

    // 1. Cek apakah file sudah ada untuk mendapatkan SHA (Wajib untuk update file)
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: file_path,
      });

      // Pastikan response adalah file tunggal, bukan direktori (array)
      if (!Array.isArray(data) && (data as any).sha) {
        sha = (data as any).sha;
      }
    } catch (error: any) {
      // Jika error 404, artinya file belum ada. Ini normal untuk pembuatan file baru.
      if (error.status !== 404) {
        console.error('Error checking file existence:', error);
        throw error;
      }
    }

    // 2. Buat atau Update File
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file_path,
      message: commit_message,
      // API GitHub membutuhkan konten dalam format Base64
      content: Buffer.from(new_content).toString('base64'),
      sha, // Sertakan SHA jika mengupdate, undefined jika membuat baru
    });

    return NextResponse.json({
      success: true,
      message: sha ? 'File updated successfully' : 'File created successfully',
      data: response.data.commit,
      html_url: response.data.commit.html_url
    });

  } catch (error: any) {
    console.error('GitHub Commit API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}