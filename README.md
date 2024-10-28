<div align="center">

![Code Size](https://img.shields.io/github/languages/code-size/krauters/environment)
![Commits per Month](https://img.shields.io/github/commit-activity/m/krauters/environment)
![Contributors](https://img.shields.io/github/contributors/krauters/environment)
![Forks](https://img.shields.io/github/forks/krauters/environment)
![GitHub Stars](https://img.shields.io/github/stars/krauters/environment)
![Install Size](https://img.shields.io/npm/npm/dw/@krauters%2Futils)
![GitHub Issues](https://img.shields.io/github/issues/krauters/environment)
![Last Commit](https://img.shields.io/github/last-commit/krauters/environment)
![License](https://img.shields.io/github/license/krauters/environment)
<a href="https://www.linkedin.com/in/coltenkrauter" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-%230077B5.svg?&style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"></a>
[![npm version](https://img.shields.io/npm/v/@krauters%2Futils.svg?style=flat-square)](https://www.npmjs.org/package/@krauters/environment)
![Open PRs](https://img.shields.io/github/issues-pr/krauters/environment)
![Repo Size](https://img.shields.io/github/repo-size/krauters/environment)
![Version](https://img.shields.io/github/v/release/krauters/environment)
![visitors](https://visitor-badge.laobi.icu/badge?page_id=krauters/environment)

</div>

# @krauters/environment

Typesafe control over environment variables in TypeScript with powerful configurations for required and optional variables, custom transformations, and type safety. Inspired by [@hexlabs/env-vars-ts](https://github.com/hexlabsio/env-vars-ts).

[![Build](https://github.com/your-repo/actions/workflows/build.yml/badge.svg)](https://github.com/your-repo/actions/workflows/build.yml)
[![npm version](https://badge.fury.io/js/environment-builder-ts.svg)](https://badge.fury.io/js/environment-builder-ts)

## Get Started

### Installation

Install the package via npm:
```bash
npm install environment-builder-ts
```

### Defining Environment Variables

Define **required** and **optional** environment variables with ease, using strong TypeScript typing.

```typescript
import { EnvironmentBuilder } from 'environment-builder-ts'

// Define required variables
const builder = EnvironmentBuilder.create('API_URL', 'API_KEY')

// Define optional variables
const environment = builder.optionals('LOG_LEVEL', 'DEBUG_MODE').environment()
```

### Example Usage

Configure environment variables with custom defaults and transformations, then retrieve them from `process.env`.

```typescript
// Example setup with defaults and transformations
const config = EnvironmentBuilder
  .create('API_URL', 'TIMEOUT') // Define required variables
  .optionals('LOG_LEVEL') // Define optional variables
  .defaults({ TIMEOUT: '3000' }) // Provide defaults
  .transform(value => parseInt(value), 'TIMEOUT') // Custom transformation to number
  .environment() // Retrieve environment variables

console.log(config.API_URL) // Outputs API_URL value
console.log(config.TIMEOUT) // Outputs timeout as a number, e.g., 3000
console.log(config.LOG_LEVEL) // Optional, may be undefined if not set
```

### Advanced Usage

Apply multiple custom transformations and defaults as needed.

```typescript
// Define a more complex environment with multiple types and transformations
const envConfig = EnvironmentBuilder
  .create('ENABLED_FEATURES', 'MAX_CONNECTIONS')
  .optionals('LOG_LEVEL', 'API_VERSION')
  .transform(s => s.split(','), 'ENABLED_FEATURES') // Transform comma-separated string to array
  .transform(s => parseInt(s), 'MAX_CONNECTIONS')
  .defaults({ MAX_CONNECTIONS: 5 })
  .environment()

// Typed values
console.log(envConfig.ENABLED_FEATURES) // ['feature1', 'feature2']
console.log(envConfig.MAX_CONNECTIONS) // 5
```

## Key Features

- **Type Safety**: Explicit typing for environment variables, catching issues at compile time.
- **Custom Transformations**: Define custom transformations (e.g., parse strings to numbers, arrays).
- **Built-In Validation**: Required variables are validated, and an error is thrown if any are missing.
- **Configurable**: Easily designate required/optional variables and specify defaults only where needed.

## Husky Git Hooks

Husky is integrated to streamline commit processes by automating checks before commits are finalized. This setup enforces code quality standards across your team and ensures that bundled assets remain consistent.

### Custom Pre-Commit Hook

This project uses a custom pre-commit hook that triggers `npm run bundle` before each commit. This ensures that any code related to bundling is always updated before it’s committed, especially useful for TypeScript applications in CI/CD. Husky automates this check to enforce consistency across commits.

## Acknowledgments

This project draws inspiration from `@hexlabs/env-vars-ts`, which laid the groundwork for a simple and effective approach to managing environment variables in TypeScript. Special thanks to the team for their work.

## Contributing

The goal of this project is to continually evolve and improve its core features, making it more efficient and easier to use. Development happens openly here on GitHub, and we’re thankful to the community for contributing bug fixes, enhancements, and fresh ideas. Whether you're fixing a small bug or suggesting a major improvement, your input is invaluable.

## License

This project is licensed under the ISC License. Please see the [LICENSE](./LICENSE) file for more details.

## 🥂 Thanks Contributors

Thanks for spending time on this project.

<a href="https://github.com/krauters/utils/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=krauters/utils" />
</a>

## 🔗 Other packages in the family
We’ve got more than just this one in our toolbox – check out the rest of our `@krauters` collection on [npm/@krauters](https://www.npmjs.com/search?q=%40krauters). It’s the whole kit and caboodle you didn’t know you needed.
