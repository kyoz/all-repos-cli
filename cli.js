#!/usr/bin/env node

'use strict';

const meow = require('meow');
const userRepos = require('all-repos');
const npmCurrentUser = require('npm-current-user');
const ora = require('ora');
const inquirer = require('inquirer');
const columnify = require('columnify');
const termSize = require('term-size');
const opn = require('opn');
const Fuse = require('fuse.js');

const cli = meow(`
  Usage
    # Get github repositories of current logged npm user
    $ all-repos
    # Get github repositories by github username 
    $ all-repos <username> 
`);

console.clear();
const spinner = ora(`Getting ${cli.input.length > 0 ? cli.input + '\'s' : 'your'} github repos infomation...`).start();
let repos = [];

spinner.color = 'blue';

getGithubUsername().then(githubUsername => {
  userRepos(githubUsername).then(_repos => {
    repos = formatRepos(_repos);
    spinner.stop();
    console.log('');

    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
    inquirer.prompt([{
      type: 'autocomplete',
      name: 'from',
      message: 'Type to search repos: ',
      source: searchRepos
    }]).then(answers => {
      opn(answers.from.url, {wait: false});
      console.clear();
    });
  });
});

function getGithubUsername() {
  return new Promise(resolve => {
    if (cli.input.length > 0) {
      resolve(cli.input);
    } else {
      npmCurrentUser().then(info => {
        resolve(info && info.github ? info.github : null);
      });
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
    results.push({
      name: columnify([{
        name: repo.name,
        description: repo.description ? repo.description.length <= descriptionSize ?
          repo.description : repo.description.slice(0, descriptionSize - 3) + '...' : '',
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
