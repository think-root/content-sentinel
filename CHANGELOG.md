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
