# [1.13.0](https://github.com/think-root/content-sentinel/compare/v1.12.0...v1.13.0) (2025-03-31)


### Features

* add collect settings management and save functionality ([7247fcb](https://github.com/think-root/content-sentinel/commit/7247fcb81fe15fc3cb43384bf4d4e599e68eaaa4))
* add instruction for separating multiple repository URLs in GenerateForm ([6ab3c10](https://github.com/think-root/content-sentinel/commit/6ab3c10e92c6cceb85f112098aae46ee96ec7fad))
* **api:** add collect settings API functions ([17a33c3](https://github.com/think-root/content-sentinel/commit/17a33c3d46a8b6c5033eaceccacca2e4fc63961c))

# [1.12.0](https://github.com/think-root/content-sentinel/compare/v1.11.0...v1.12.0) (2025-03-30)


### Features

* add cron jobs fetching and error handling to App component ([aefda11](https://github.com/think-root/content-sentinel/commit/aefda11546bb63f5d35d4069e2edaee6c86c7c0f))
* add loading state to RepositoryList component ([ce8f992](https://github.com/think-root/content-sentinel/commit/ce8f9925f1252508a75a9318c4295b302bd97269))
* enhance CronJobs component with loading state and props for jobs ([0c0f487](https://github.com/think-root/content-sentinel/commit/0c0f4874ebe8b578d9a9b96c58b11ef94ba5fe07))

# [1.11.0](https://github.com/think-root/content-sentinel/compare/v1.10.0...v1.11.0) (2025-03-28)


### Features

* update application icons for improved visual consistency ([59d970a](https://github.com/think-root/content-sentinel/commit/59d970aea9371dc2125483f2aa60b6fe943c580c))

# [1.10.0](https://github.com/think-root/content-sentinel/compare/v1.9.0...v1.10.0) (2025-03-28)


### Features

* add expandable section to repository list ([bce82c6](https://github.com/think-root/content-sentinel/commit/bce82c66ebafdba48e5bbf0d39c5a62b70cfdefc))
* add tooltip to toggle button in CronJobs component ([92e6761](https://github.com/think-root/content-sentinel/commit/92e6761d2ea1f37be33a096c670fab41ab8ff100))
* enhance search functionality in RepositoryList to include date filters and update placeholder text ([74b851a](https://github.com/think-root/content-sentinel/commit/74b851a41cf87b623835e58666d7b2798fa5fbb1))
* replace Plus icon with RefreshCw icon in GenerateForm component during loading state ([f6732af](https://github.com/think-root/content-sentinel/commit/f6732afd067f7313f1c41cb2cd3effdccfcda26b))

# [1.9.0](https://github.com/think-root/content-sentinel/compare/v1.8.0...v1.9.0) (2025-03-27)


### Features

* add clear input functionality to GenerateForm and RepositoryList components ([71a93d7](https://github.com/think-root/content-sentinel/commit/71a93d7452bbf44115ed592942b86443792506a1))
* add theme persistence and dynamic meta theme color ([13e654e](https://github.com/think-root/content-sentinel/commit/13e654e4d9ebb9536f938a19a7cb074dc02c30c1))

# [1.8.0](https://github.com/think-root/content-sentinel/compare/v1.7.0...v1.8.0) (2025-03-27)


### Bug Fixes

* remove redundant validation logic in SettingsModal ([fbdb685](https://github.com/think-root/content-sentinel/commit/fbdb685b2593bcef4106acc2790ec4382cbeff0f))


### Features

* add manifest.json for PWA ([7fcf73b](https://github.com/think-root/content-sentinel/commit/7fcf73b41499dec334be04b48605bacea7a56ebf))
* add page reload on dashboard link click ([77c7e35](https://github.com/think-root/content-sentinel/commit/77c7e35f7afd05dd08e819c6a220b203f805f6b5))
* add PWA support to dashboard ([4c4f21d](https://github.com/think-root/content-sentinel/commit/4c4f21db507931b56d62292c8b059e258588cc35))
* add support for multiple API settings ([0587b63](https://github.com/think-root/content-sentinel/commit/0587b631f0733521370d9710cd4325da4ddc434f))
* add tabbed settings interface and validation ([ebf2a4c](https://github.com/think-root/content-sentinel/commit/ebf2a4cf19bf51b7a3b505a7efa431fb1a929e2b))
* **api:** add CRON job management endpoints ([7a138a7](https://github.com/think-root/content-sentinel/commit/7a138a7e2594ed23e418564145461844d15e1671))
* implement dynamic cron job management ([42e4cdd](https://github.com/think-root/content-sentinel/commit/42e4cdd78ac0961adafc5d862c7e25e611dd1c9e))

# [1.7.0](https://github.com/think-root/content-sentinel/compare/v1.6.0...v1.7.0) (2025-03-26)


### Features

* **api:** enhance getRepositories function with pagination support ([111dfbd](https://github.com/think-root/content-sentinel/commit/111dfbddf2b32e3564ceb2bf6d75a809c46053e9))
* **App:** implement pagination for repository fetching ([5e1b0c0](https://github.com/think-root/content-sentinel/commit/5e1b0c0df29303ddedb9ecc6135206840028c4ed))
* **RepositoryList:** enhance pagination and repository fetching logic ([3952a49](https://github.com/think-root/content-sentinel/commit/3952a4908397f8486499e809763d261b94a55b17))
* **types:** add pagination properties to RepositoriesResponse interface ([789fe39](https://github.com/think-root/content-sentinel/commit/789fe39724f686dea4bb72df2438102017606549))

# [1.6.0](https://github.com/think-root/content-sentinel/compare/v1.5.1...v1.6.0) (2025-03-25)


### Features

* **App:** enhance header styling and layout in the main application component ([23eeaa1](https://github.com/think-root/content-sentinel/commit/23eeaa110c288edaf6a6ec5bc87617ef7f7c1472))
* **CronJobs:** add "Under construction" overlay to CronJobs component ([21c8e41](https://github.com/think-root/content-sentinel/commit/21c8e413f329f57a75de4389a28fd55ef9cdabc4))
* remove Auth0 authentication and related components from the application ([eb51847](https://github.com/think-root/content-sentinel/commit/eb518470b944035c6e3fa1f362328fd77b35d147))
* **SettingsModal:** add body overflow control on modal open/close ([a86f961](https://github.com/think-root/content-sentinel/commit/a86f96167491d03f27d60ce8871caa0176ac9b24))

## [1.5.1](https://github.com/think-root/content-sentinel/compare/v1.5.0...v1.5.1) (2025-03-24)


### Bug Fixes

* **SettingsModal:** update backdrop styling for improved visual clarity ([2728279](https://github.com/think-root/content-sentinel/commit/2728279a1686127a00aedc5dea71432a37a2f179))

# [1.5.0](https://github.com/think-root/content-sentinel/compare/v1.4.0...v1.5.0) (2025-03-24)


### Features

* **App:** add LayoutDashboard icon to header and update title ([6f9bcbe](https://github.com/think-root/content-sentinel/commit/6f9bcbe69f1bd1f62c44c1390aba91fcef3622cb))
* **README:** update README with new screenshot and enhance visual content ([8340a0b](https://github.com/think-root/content-sentinel/commit/8340a0bdf8933827179b0091957683b335246195))

# [1.4.0](https://github.com/think-root/content-sentinel/compare/v1.3.0...v1.4.0) (2025-03-24)


### Bug Fixes

* **server:** update PORT configuration to include VITE_PORT and remove deprecated API proxy middleware ([b6d8f0e](https://github.com/think-root/content-sentinel/commit/b6d8f0e7a019d0e4c920ad40a7290673e9ddbc27))


### Features

* **api-settings:** add ApiSettings interface and local storage management ([0351718](https://github.com/think-root/content-sentinel/commit/0351718674150dd2407f7e287d076cf8771d4055))
* **App:** add SettingsButton and update header styling ([ef2ec43](https://github.com/think-root/content-sentinel/commit/ef2ec43324252299e4581a423d4b85ea07cf15b6))
* **auth:** add configuration interfaces for API and context management ([c5b7259](https://github.com/think-root/content-sentinel/commit/c5b725975536d38439b33664d36d1f1b08d44526))
* **auth:** implement ConfigProvider and useConfig hook for API configuration management ([ff0a1f6](https://github.com/think-root/content-sentinel/commit/ff0a1f6aa0ac282cfd5b8034497f47c40f68cdb5))
* **date:** implement formatDate utility function and remove legacy date formatting ([ec09b93](https://github.com/think-root/content-sentinel/commit/ec09b93cf0476fc141bbe904a32fe44eaddca11b))
* **SettingsButton:** add SettingsButton component with modal functionality ([f06bce8](https://github.com/think-root/content-sentinel/commit/f06bce822509442584d92f2197ad127e779f74b0))
* **SettingsModal:** add SettingsModal component for user settings management ([113c6e0](https://github.com/think-root/content-sentinel/commit/113c6e033b766619e10ae95ab377e765f051f960))
* **Toast:** add Toast component for displaying success and error messages ([3a25cba](https://github.com/think-root/content-sentinel/commit/3a25cba557e26d97a53fbfa8f51a80bf458e68c2))
* **useDisclosure:** add custom hook for managing open/close state ([9164a4e](https://github.com/think-root/content-sentinel/commit/9164a4e62ddd307d7c562ed8336508356dcfa026))

# [1.3.0](https://github.com/think-root/content-sentinel/compare/v1.2.0...v1.3.0) (2025-03-24)


### Bug Fixes

* **api:** update API base URL to use environment variable ([fd6be90](https://github.com/think-root/content-sentinel/commit/fd6be9019c53138f746adbaf4c8837a311cb6721))


### Features

* **App:** implement routing and authentication for dashboard ([812b2c3](https://github.com/think-root/content-sentinel/commit/812b2c3bcd470071d463c68de259dbc6dc476160))
* **auth:** add AuthProvider component for authentication management ([b61f2c5](https://github.com/think-root/content-sentinel/commit/b61f2c538fd55aa0b4d5b15d12ee94a6b708ca45))
* **auth:** add ProtectedRoute component for route protection ([cc91ae9](https://github.com/think-root/content-sentinel/commit/cc91ae9ad223b3f1a89869f1c6bed3b614fd6b94))
* **auth:** create index file for authentication exports ([5bf9725](https://github.com/think-root/content-sentinel/commit/5bf972579528ea4d90c2eee1032f57f698780520))
* **auth:** implement useAuth hook for authentication management ([d84a153](https://github.com/think-root/content-sentinel/commit/d84a153e6c2b37e48f87cb5531df255a6c58c6d6))
* **Login:** create Login component for user authentication ([d228084](https://github.com/think-root/content-sentinel/commit/d228084bd59dabd2fa0e12f92d74e8538f5efd89))
* **server:** implement dashboard routing and static file serving ([59a72a9](https://github.com/think-root/content-sentinel/commit/59a72a9722685aa1b3446f4b7ab091b771a2a9eb))
* **ThemeToggle:** add title attribute for improved accessibility ([b4dbda9](https://github.com/think-root/content-sentinel/commit/b4dbda98bee24ec5fae4468fd862b466beb0503e))
* **UserMenu:** add UserMenu component for user logout functionality ([614c99b](https://github.com/think-root/content-sentinel/commit/614c99b76c6792aecb80c9269f8f201131ef9210))

# [1.2.0](https://github.com/think-root/content-sentinel/compare/v1.1.0...v1.2.0) (2025-03-23)


### Features

* add date formatting utility ([7a30738](https://github.com/think-root/content-sentinel/commit/7a30738ee56c7148cfe1a2bc8488d46238f980bf))
* add new environment variables for date format and timezone ([1a8c78b](https://github.com/think-root/content-sentinel/commit/1a8c78bf20483b8ad6d88b8c07a4893333c959f6))
* add optional date fields to Repository type ([09e71bd](https://github.com/think-root/content-sentinel/commit/09e71bd8859afefdd66f0a0d41930704f3082cd8))
* add repository previews for latest and next posts ([4cc3e5c](https://github.com/think-root/content-sentinel/commit/4cc3e5c157e126b4ee907215561fe90195d21ffa))
* add RepositoryPreview component ([9843ab2](https://github.com/think-root/content-sentinel/commit/9843ab2b55252f92db21d883e5e3cc0158043b1a))
* **api:** add functions to get latest and next repositories ([2f74d26](https://github.com/think-root/content-sentinel/commit/2f74d26c89dc7514a541638eb9b8b655b3a542c2))
* **api:** add sorting options to getRepositories function ([83f7288](https://github.com/think-root/content-sentinel/commit/83f72887493c7763d7a8791d1cbd9933d2f49fbd))
* **RepositoryList:** add sorting and truncation features ([18b8d50](https://github.com/think-root/content-sentinel/commit/18b8d503df44265b1911da8aeb28f2e6c5d85b79))

# [1.1.0](https://github.com/think-root/content-sentinel/compare/v1.0.0...v1.1.0) (2025-03-22)


### Features

* add Bearer Token to Vite environment ([d3087c1](https://github.com/think-root/content-sentinel/commit/d3087c1f95f6e7dc3ee15591878a1674cb441616))

# 1.0.0 (2025-03-20)


### Features

* add express server with proxy middleware ([6883e4d](https://github.com/think-root/content-sentinel/commit/6883e4da31261f599581b7d90b98b34417386029))
* add responsive design to CronJobs and RepositoryList components ([a5e0f3d](https://github.com/think-root/content-sentinel/commit/a5e0f3d48e0498fc421aa7bcffb274658e96c656))
* **ci:** add release trigger on gitleaks success ([7a23a18](https://github.com/think-root/content-sentinel/commit/7a23a18ded025e59b03ac10f214e19b023707eef))
