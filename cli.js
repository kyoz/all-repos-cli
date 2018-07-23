#!/usr/bin/env node

'use strict';

const fs = require('fs');
const meow = require('meow');
const userRepos = require('all-repos');
const npmCurrentUser = require('npm-current-user');
const ora = require('ora');
const inquirer = require('inquirer');
const columnify = require('columnify');
const termSize = require('term-size');
const opn = require('opn');
const Fuse = require('fuse.js');
const rimraf = require('rimraf');

let repos = [];
let isNotUpdate = true;
let prompTitle = 'Type to search repos: ';
let spinner;

const cli = meow(`
  Usage
    $ repos
    $ repos <github-username>
  Options
    --update, --u           Update repositories data to latest
    --updateUser, --uu      Update default user (Since 'npm whoami' is quite slow)
    --clearCache, --cc      Clear local cache
  Examples
    $ repos                 Get local repositories of current user
    $ repos banminkyoz      Get local repositories of 'banminkyoz'
    $ repos --u             Update repositories of current user to latest
    $ repos --u banminkyoz  Update repositories of 'banminkyoz' to latest
    $ repos --uu            Update npm current logged user
    $ repos --cc            Clear all local cache
`, {
  flags: {
    update: {
      type: 'boolean',
      alias: 'u'
    },
    updateUser: {
      type: 'boolean',
      alias: 'uu'
    },
    clearCache: {
      type: 'boolean',
      alias: 'cc'
    }
  }
});

if (cli.flags.clearCache || cli.flags.cc) {
  rimraf(`${__dirname}/data/`, () => {
    console.log(`Cleared cache !`);
  });
} else {
  startCLI();
}

function startCLI() {
  // Start
  console.clear();
  spinner = ora(`Getting ${cli.input.length > 0 ? cli.input + '\'s' : 'your'} github repos infomation...`).start();

  spinner.color = 'blue';

  if (!fs.existsSync(`${__dirname}/data`)) {
    fs.mkdirSync(`${__dirname}/data`);
  }

  getGithubUsername().then(githubUsername => {
    const dataPath = `${__dirname}/data/${githubUsername}.json`;

    if (isNotUpdate && fs.existsSync(dataPath)) {
      repos = formatRepos(require(dataPath));
      prompTitle = 'Type to search repos: (local): ';
      initPrompt('');
      return;
    }

    prompTitle = 'Type to search repos: (up-to-date): ';
    userRepos(githubUsername).then(_repos => {
      repos = formatRepos(_repos);

      // Save data
      fs.writeFile(dataPath, JSON.stringify(_repos), err => {
        if (err) {
          console.error(err);
        }
      });

      initPrompt();
    });
  });
}

function initPrompt() {
  spinner.stop();
  console.log('');
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  inquirer.prompt([{
    type: 'autocomplete',
    name: 'from',
    message: prompTitle,
    source: searchRepos
  }]).then(answers => {
    opn(answers.from.url, {wait: false});
    console.clear();
  });
}

function getGithubUsername() {
  return new Promise(resolve => {
    if (cli.flags.u) {
      isNotUpdate = false;
      if (cli.flags.u !== true) {
        resolve(cli.flags.u);
      }
    }

    if (cli.flags.update) {
      isNotUpdate = false;
      if (cli.flags.update !== true) {
        resolve(cli.flags.update);
      }
    }

    if (cli.input.length > 0) {
      resolve(cli.input);
    }

    const dataPath = `${__dirname}/data/current_user.json`;
    if (cli.flags.uu || cli.flags.updateUser || !fs.existsSync(dataPath)) {
      npmCurrentUser().then(info => {
        fs.writeFile(dataPath, JSON.stringify({name: `${info.github}`}), err => {
          if (err) {
            console.error(err);
          }
        });
        resolve(info && info.github ? info.github : null);
      });
    } else {
      const githubUser = require(dataPath);
      resolve(githubUser.name);
    }
  });
}

function formatRepos(repos) {
  let nameSize = 10;

  for (const repo of repos) {
    if (repo.name.length > nameSize) {
      nameSize = repo.name.length;
    }
  }
  nameSize += 2;

  const results = [];
  const forkSize = 6;
  const starSize = 14;
  const termimalSize = termSize();
  const descriptionSize = termimalSize.columns - nameSize - forkSize - starSize - 10;

  for (const repo of repos) {
    const description = repo.description ? repo.description.length <= descriptionSize ?
      repo.description : repo.description.slice(0, descriptionSize - 3) + '...' : '';

    results.push({
      name: columnify([{
        name: repo.name,
        description: description.replace(/[^ -~]+/g, ''),
        forked: repo.forkFrom ? '(Fork)' : '',
        star: repo.stars + ' ⭐️'
      }], {
        showHeaders: false,
        maxLineWidth: 180,
        config: {
          name: {
            minWidth: nameSize,
            maxWidth: nameSize
          },
          description: {
            minWidth: descriptionSize,
            maxWidth: descriptionSize
          },
          forked: {
            minWidth: forkSize,
            maxWidth: forkSize
          },
          star: {
            minWidth: starSize,
            maxWidth: starSize,
            align: 'right'
          }
        }
      }),
      value: repo
    });
  }

  return results;
}

function searchRepos(answers, input) {
  input = input || '';
  const options = {
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['name']
  };
  const fuse = new Fuse(repos, options); // "list" is the item array
  const searchResult = fuse.search(input);
  return Promise.resolve(searchResult.length > 0 ? searchResult : input === '' ? repos : []);
}
