import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;

const dataDir = path.join(__dirname, '..', 'data', 'raw');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

async function fetchPullRequests() {
  console.log('Fetching pull requests...');
  const prs: any[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.pulls.list({
      owner: OWNER, repo: REPO,
      state: 'all', per_page: 100, page
    });
    if (data.length === 0) break;

    for (const pr of data) {
      const { data: reviews } = await octokit.pulls.listReviews({
        owner: OWNER, repo: REPO, pull_number: pr.number
      });
      const { data: comments } = await octokit.pulls.listReviewComments({
        owner: OWNER, repo: REPO, pull_number: pr.number
      });

      prs.push({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        author: pr.user?.login || '',
        created_at: pr.created_at,
        merged_at: pr.merged_at,
        files_changed: (pr as any).changed_files || 0,
        reviews: reviews.map(r => ({
          author: r.user?.login,
          body: r.body,
          state: r.state
        })),
        comments: comments.map(c => ({
          author: c.user?.login,
          body: c.body,
          path: c.path
        }))
      });
    }
    page++;
    if (data.length < 100) break;
  }

  fs.writeFileSync(
    path.join(dataDir, 'pull_requests.json'),
    JSON.stringify(prs, null, 2)
  );
  console.log(`Saved ${prs.length} pull requests`);
  return prs;
}

async function fetchCommits() {
  console.log('Fetching commits...');
  const commits: any[] = [];
  let page = 1;

  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  while (true) {
    const { data } = await octokit.repos.listCommits({
      owner: OWNER, repo: REPO,
      per_page: 100, page,
      since: since.toISOString()
    });
    if (data.length === 0) break;

    commits.push(...data.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message,
      author: c.commit.author?.name || '',
      date: c.commit.author?.date || '',
      files: []
    })));

    page++;
    if (data.length < 100) break;
  }

  fs.writeFileSync(
    path.join(dataDir, 'commits.json'),
    JSON.stringify(commits, null, 2)
  );
  console.log(`Saved ${commits.length} commits`);
  return commits;
}

async function fetchIssues() {
  console.log('Fetching issues...');
  const issues: any[] = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.issues.listForRepo({
      owner: OWNER, repo: REPO,
      state: 'all', per_page: 100, page
    });
    if (data.length === 0) break;

    const filtered = data.filter(i => !i.pull_request);

    for (const issue of filtered) {
      const { data: comments } = await octokit.issues.listComments({
        owner: OWNER, repo: REPO, issue_number: issue.number
      });

      issues.push({
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        author: issue.user?.login || '',
        created_at: issue.created_at,
        state: issue.state,
        labels: issue.labels.map((l: any) => l.name),
        comments: comments.map(c => ({
          author: c.user?.login,
          body: c.body
        }))
      });
    }

    page++;
    if (data.length < 100) break;
  }

  fs.writeFileSync(
    path.join(dataDir, 'issues.json'),
    JSON.stringify(issues, null, 2)
  );
  console.log(`Saved ${issues.length} issues`);
  return issues;
}

async function fetchRepoInfo() {
  console.log('Fetching repo info...');
  const { data: repo } = await octokit.repos.get({ owner: OWNER, repo: REPO });
  
  const { data: contributors } = await octokit.repos.listContributors({
    owner: OWNER, repo: REPO
  });

  const info = {
    name: repo.name,
    description: repo.description,
    language: repo.language,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    topics: repo.topics,
    contributors: contributors.map(c => ({
      login: c.login,
      contributions: c.contributions
    }))
  };

  fs.writeFileSync(
    path.join(dataDir, 'repo_info.json'),
    JSON.stringify(info, null, 2)
  );
  console.log('Saved repo info');
  return info;
}

async function main() {
  console.log(`\nStarting ingestion for ${OWNER}/${REPO}\n`);
  
  try {
    await fetchRepoInfo();
    await fetchPullRequests();
    await fetchCommits();
    await fetchIssues();

    const state = {
      last_run: new Date().toISOString(),
      owner: OWNER,
      repo: REPO
    };
    
    if (!fs.existsSync(path.join(__dirname, '..', 'data'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'state.json'),
      JSON.stringify(state, null, 2)
    );

    console.log('\nIngestion complete!');
    console.log('Files saved to data/raw/');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();