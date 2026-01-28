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
  // Try multiple paths to find the module (action directory or project directory)
  let commitAnalyzer;
  try {
    commitAnalyzer = require("@semantic-release/commit-analyzer");
  } catch (e) {
    // If not found in normal path, try to resolve from semantic-release's location
    const path = require("path");
    const semanticReleasePath = require.resolve("semantic-release");
    const actionNodeModules = path.join(
      path.dirname(semanticReleasePath),
      "..",
    );
    commitAnalyzer = require(
      path.join(actionNodeModules, "@semantic-release/commit-analyzer"),
    );
  }

  const wrappedConfig = pluginConfig.wrappedConfig || {
    preset: "conventionalcommits",
  };

  return await commitAnalyzer.analyzeCommits(wrappedConfig, wrappedContext);
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
  // Try multiple paths to find the module (action directory or project directory)
  let releaseNotesGenerator;
  try {
    releaseNotesGenerator = require("@semantic-release/release-notes-generator");
  } catch (e) {
    // If not found in normal path, try to resolve from semantic-release's location
    const path = require("path");
    const semanticReleasePath = require.resolve("semantic-release");
    const actionNodeModules = path.join(
      path.dirname(semanticReleasePath),
      "..",
    );
    releaseNotesGenerator = require(
      path.join(actionNodeModules, "@semantic-release/release-notes-generator"),
    );
  }

  const wrappedConfig = pluginConfig.wrappedConfig || {
    preset: "conventionalcommits",
  };

  return await releaseNotesGenerator.generateNotes(
    wrappedConfig,
    wrappedContext,
  );
}

module.exports = { analyzeCommits, generateNotes };
