# all-repos-cli 

> Useful CLI to get github repositories

[![Build Status](https://travis-ci.org/banminkyoz/all-repos-cli.svg?branch=master)](https://travis-ci.org/banminkyoz/all-repos-cli) [![NPM version](https://badge.fury.io/js/all-repos-cli.svg)](http://badge.fury.io/js/all-repos-cli) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

<p align="center">
  <img src="demo.gif" width="800">
</p>

## Introduce

- Since Github API do have rate limit, i do use another approach is to get infomation in webpage.
- But it's not good if we send too much request, so i do store data in local json files to read more faster and we don't have to request to github too much. Just when we need lastest data, we do update (It's like `git pull`...).

## Install

```
$ npm install -g all-repos-cli
```

## Usage

```js
$ repos --help

  Usage
    $ repos
    $ repos <github-username>
  Options
    --update, --u           Update repositories data to latest
    --updateUser, --uu      Update default user (Since 'npm whoami' is quite slow)
  Examples
    $ repos                 Get local repositories of current user
    $ repos banminkyoz      Get local repositories of 'banminkyoz'
    $ repos --u             Update repositories of current user to latest
    $ repos --u banminkyoz  Update repositories of 'banminkyoz' to latest
    $ repos --uu            Update npm current logged user
```

## Related

- [all-repos](https://github.com/banminkyoz/all-repos) - API for this module

## License

MIT © [Kyoz](mailto:banminkyoz@gmail.com)