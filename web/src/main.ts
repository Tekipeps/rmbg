// GitHub repository information
const GITHUB_REPO = 'Tekipeps/rmbg';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Types
interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  assets: GitHubAsset[];
}

type DownloadPattern = string[];
type DownloadPatterns = Record<string, DownloadPattern>;

// Map download buttons to their respective file patterns
const DOWNLOAD_PATTERNS: DownloadPatterns = {
  'macos-x64': ['.dmg', 'x86_64-apple-darwin'],
  'macos-arm64': ['.dmg', 'aarch64-apple-darwin'],
  'linux-x64': ['.AppImage', 'x86_64-unknown-linux-gnu'],
  'windows-x64': ['.msi', 'x86_64-pc-windows-msvc']
};

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) {
      throw new Error('Failed to fetch release data');
    }
    const data = await response.json() as GitHubRelease;
    return data;
  } catch (error) {
    console.error('Error fetching release:', error);
    return null;
  }
}

function findAssetUrl(assets: GitHubAsset[], patterns: DownloadPattern): string | null {
  for (const asset of assets) {
    const matchesAllPatterns = patterns.every(pattern =>
      asset.name.toLowerCase().includes(pattern.toLowerCase())
    );
    if (matchesAllPatterns) {
      return asset.browser_download_url;
    }
  }
  return null;
}

function updateDownloadLinks(releaseData: GitHubRelease | null): void {
  if (!releaseData || !releaseData.assets) {
    console.error('No release data available');
    setFallbackLinks();
    return;
  }

  const buttons = document.querySelectorAll<HTMLAnchorElement>('.download-button');

  buttons.forEach(button => {
    const os = button.dataset.os;
    const patterns = os ? DOWNLOAD_PATTERNS[os] : undefined;

    if (patterns) {
      const url = findAssetUrl(releaseData.assets, patterns);
      if (url) {
        button.href = url;
      } else {
        setFallbackLink(button);
      }
    }
  });
}

function setFallbackLink(button: HTMLAnchorElement): void {
  button.href = `https://github.com/${GITHUB_REPO}/releases/latest`;
}

function setFallbackLinks(): void {
  const buttons = document.querySelectorAll<HTMLAnchorElement>('.download-button');
  buttons.forEach(setFallbackLink);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const releaseData = await fetchLatestRelease();
  updateDownloadLinks(releaseData);
});
