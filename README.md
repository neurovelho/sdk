# @jupiterone/sdk

A collection of packages supporting integrations with JupiterOne.

## Introduction

Integrating with JupiterOne may take one these paths:

1. A command line script (sh, bash, zsh, etc.) using the [JupiterOne CLI
   tool][2] to easily query/create/update/delete entities and relationships in
   bulk
1. Any programming/scripting language making HTTP GraphQL requests to
   [query/create/update/delete entities and relationships][1]
1. A JavaScript program using the [JupiterOne Node.js client library][2] to
   query/create/update/delete entities and relationships
1. A structured integration leveraging **this SDK** to dramatically simplify the
   syncronization process, essential for any significant, ongoing integration
   effort

The integration SDK structures an integration as a collection of simple, atomic
steps, executed in a particular order. It submits generated entities and
relationships, along with the raw data from the provider used to build the
entities, to the JupiterOne synchronization system, which offloads complex graph
update operations, provides integration progress information, and isolates
failures to allow for as much ingestion as possible.

An integration built this way runs not only on your local machine; it can be
deployed to JupiterOne's managed infrastructure. You can easily build the
integration you need today and run it wherever you'd like. When you're ready, we
can help you get that integration running within the JupiterOne infrastructure,
lowering your operational costs and simplifying adoption of your integration
within the security community!

Please reference the
[integration development documentation](docs/integrations/development.md) for
details about how to develop integrations with this SDK.

## Development

First install dependencies using `yarn`.

This project utilizes TypeScript project references for incremental builds. To
prepare all of the packages, run `yarn build`. If you are making a changes
across multiple packages, it is recommended you run `yarn build --watch` to
automatically compile changes as you work.

### Linking packages

If you are making changes to the SDK and you want to test the changes in another
project then it is recommended to automatically rebuild and link this project
when changes are made.

Steps to automatically build and link:

- Run `yarn build` or `yarn build --watch` in _this_ project from a terminal and
  wait for initial build to complete.

- Run `yarn link` in the package that you want to link.

- In a separate terminal, run `yarn link @jupiterone/<package to link>` in the
  integration project. You can now use the integration SDK CLI in the other
  project and it will use the latest code on your filesystem.

[1]: https://support.jupiterone.io/hc/en-us/articles/360022722094-JupiterOne-Platform-API
[2]: https://github.com/JupiterOne/jupiterone-client-nodejs
