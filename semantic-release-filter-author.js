/**
 * Temporary plugin to filter commits by author email or name
 * Remove this after the initial release with subtree commits
 *
 * Internal helper to filter commits based on config
 */
function filterCommits(commits, excludeAuthors, logger) {
  if (!excludeAuthors) return commits;

  console.log("excludeAuthors", excludeAuthors);
  console.log("commits", commits);

  const authors = Array.isArray(excludeAuthors)
    ? excludeAuthors
    : [excludeAuthors];

  return commits.filter((commit) => {
    const authorEmail = commit.author?.email || "";

    const shouldExclude = authors.some((author) =>
      authorEmail.includes(author),
    );

    if (shouldExclude && logger) {
      logger.log(
        `Excluding commit ${commit.hash.substring(0, 7)} by ${authorEmail}: ${commit.subject}`,
      );
    }

    return !shouldExclude;
  });
}

async function analyzeCommits(pluginConfig, context) {
  const { commits, logger } = context;
  const originalCount = commits.length;

  // Filter commits
  const filteredCommits = filterCommits(
    commits,
    pluginConfig.excludeAuthors,
    logger,
  );

  logger.log(
    `Filtered ${originalCount - filteredCommits.length} commits out of ${originalCount} in analyzeCommits`,
  );

  // Create a new context with filtered commits for the wrapped plugin
  const wrappedContext = { ...context, commits: filteredCommits };

  // Load and call the actual commit analyzer
  const commitAnalyzer = require("@semantic-release/commit-analyzer");
  const analyzerConfig = {
    preset: "conventionalcommits",
  };

  return await commitAnalyzer.analyzeCommits(analyzerConfig, wrappedContext);
}

async function generateNotes(pluginConfig, context) {
  const { commits, logger } = context;
  const originalCount = commits.length;

  // Filter commits
  const filteredCommits = filterCommits(
    commits,
    pluginConfig.excludeAuthors,
    logger,
  );

  if (logger) {
    logger.log(
      `Filtered ${originalCount - filteredCommits.length} commits out of ${originalCount} in generateNotes`,
    );
  }

  // Create a new context with filtered commits for the wrapped plugin
  const wrappedContext = { ...context, commits: filteredCommits };

  // Load and call the actual release notes generator
  const releaseNotesGenerator = require("@semantic-release/release-notes-generator");
  const notesConfig = {
    preset: "conventionalcommits",
    presetConfig: {
      preset: {
        name: "conventionalchangelog",
      },
    },
  };

  return await releaseNotesGenerator.generateNotes(notesConfig, wrappedContext);
}

module.exports = { analyzeCommits, generateNotes };
