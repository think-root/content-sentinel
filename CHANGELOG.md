## [1.33.1](https://github.com/think-root/content-sentinel/compare/v1.33.0...v1.33.1) (2025-07-05)


### Bug Fixes

* **api:** include llm_output_language in autoGenerate function ([22e636d](https://github.com/think-root/content-sentinel/commit/22e636d61817b09ca2c33ec106197f04ce850e1a))

# [1.33.0](https://github.com/think-root/content-sentinel/compare/v1.32.0...v1.33.0) (2025-07-05)


### Features

* **src/utils:** add language validation utility ([d3fd3d5](https://github.com/think-root/content-sentinel/commit/d3fd3d5bf05946cbedf0de95be847fa113a3163e))
* **ui:** add language validation for prompt settings ([00f7cd6](https://github.com/think-root/content-sentinel/commit/00f7cd667ef869499dd39cb80b96b5f53f7b5386))

# [1.32.0](https://github.com/think-root/content-sentinel/compare/v1.31.0...v1.32.0) (2025-07-04)


### Features

* **ui:** add confirmation dialog for resetting prompt settings ([0dc1190](https://github.com/think-root/content-sentinel/commit/0dc1190db43f7b39fcd8a09cd2d9f650698a638b))

# [1.31.0](https://github.com/think-root/content-sentinel/compare/v1.30.0...v1.31.0) (2025-07-04)


### Features

* **ui:** add inline edit and delete for repository text ([52ae49c](https://github.com/think-root/content-sentinel/commit/52ae49cbfea513fd3619f8c1ab1e149b29f2cf7f))

# [1.30.0](https://github.com/think-root/content-sentinel/compare/v1.29.0...v1.30.0) (2025-07-04)


### Bug Fixes

* **ui:** update prompt label ([67a15ca](https://github.com/think-root/content-sentinel/commit/67a15ca7fe2b85876e7213b4f5f12ba496634252))


### Features

* **ui:** add collapsible filters panel to posts list ([4e6d376](https://github.com/think-root/content-sentinel/commit/4e6d37611cbed2344238254c4516f1903e151ad6))

# [1.29.0](https://github.com/think-root/content-sentinel/compare/v1.28.0...v1.29.0) (2025-06-22)


### Features

* **api:** refactor llm config management ([633c52b](https://github.com/think-root/content-sentinel/commit/633c52b0413847f110c811f549b06d471506c92e))
* **API:** refine LLM prompt for GitHub repo descriptions ([8b1398a](https://github.com/think-root/content-sentinel/commit/8b1398ad00797f56aa3b44e34cf5309097dbddd8))
* **components:** add prompt settings ([71b9814](https://github.com/think-root/content-sentinel/commit/71b9814ebd7040983cdbd219ff90501b607d509d))
* **CronJobHistory:** display job output instead of error ([cb57e61](https://github.com/think-root/content-sentinel/commit/cb57e61800dfd1687c7b5b8c2b0a7af4ee970c3c))
* **hooks:** add prompt settings import ([a905845](https://github.com/think-root/content-sentinel/commit/a905845ba02344c742196707f2faaa79eeef4ae5))
* **hooks:** implement usePromptSettings for managing prompt settings ([73965c5](https://github.com/think-root/content-sentinel/commit/73965c51bcbdb250a3c2cacfd8fede3e8d72edb2))
* **layout:** add prompt settings ([74d6ddb](https://github.com/think-root/content-sentinel/commit/74d6ddbd9e002ca501f42e416f7db1e6149aa5b2))

# [1.28.0](https://github.com/think-root/content-sentinel/compare/v1.27.0...v1.28.0) (2025-05-28)


### Features

* **CronJobHistory:** implement cron job history tracking and filtering ([50b09d6](https://github.com/think-root/content-sentinel/commit/50b09d64b1d4ac71465459ce1a5adf7bd70961f1))

# [1.27.0](https://github.com/think-root/content-sentinel/compare/v1.26.0...v1.27.0) (2025-05-27)


### Features

* **API:** integrate LLM configuration for content generation ([12a9d52](https://github.com/think-root/content-sentinel/commit/12a9d52b508f960b90356d0a3693f38b03056b7a))

# [1.26.0](https://github.com/think-root/content-sentinel/compare/v1.25.0...v1.26.0) (2025-04-27)


### Features

* **CronJobs:** enhance schedule input handling with auto-focus and escape key functionality ([64870e5](https://github.com/think-root/content-sentinel/commit/64870e5543a7fde518f95b9cfeea48e6d961b0b2))

# [1.25.0](https://github.com/think-root/content-sentinel/compare/v1.24.0...v1.25.0) (2025-04-22)


### Features

* **DashboardLayout:** enhance pull-to-refresh functionality with improved touch handling and progress indication ([fde1183](https://github.com/think-root/content-sentinel/commit/fde1183244759c41afe5ce9e11350b015e512abd))
* **DashboardLayout:** implement custom pull-to-refresh functionality with progress indicator ([4bf7a31](https://github.com/think-root/content-sentinel/commit/4bf7a310c8b3e87681bc611bfa2a96497f075a92))
* **GenerateForm, ResultDialog:** enhance button states and improve modal behavior ([68bb275](https://github.com/think-root/content-sentinel/commit/68bb2755908ee3921823f29ecbe95be2aaabd2b1))
* **SettingsModal:** improve touch handling and event prevention for better user experience ([944ec1f](https://github.com/think-root/content-sentinel/commit/944ec1f41ac3f17128378b73eca4188fa8b2b3b1))
* **useDataRefresh:** add optional notification parameter to handleManualRefresh ([631f7be](https://github.com/think-root/content-sentinel/commit/631f7bece5b230cf80bb578230b4e72de65a2180))

# [1.24.0](https://github.com/think-root/content-sentinel/compare/v1.23.0...v1.24.0) (2025-04-18)


### Features

* add API readiness check to RepositoryList component ([7a058ea](https://github.com/think-root/content-sentinel/commit/7a058ea4fcc2483f20eae872a942ebb919f294f8))
* **api:** add API configuration check before handling requests in multiple functions ([ac7c0b7](https://github.com/think-root/content-sentinel/commit/ac7c0b76fedbff5584a461a654ba66b911ce5bb9))
* **api:** add isApiConfigured function to validate API settings ([49c4696](https://github.com/think-root/content-sentinel/commit/49c4696501ddce6d4e184475b4378990d58a4c80))
* **App:** integrate API configuration check to prevent requests if not configured ([3205636](https://github.com/think-root/content-sentinel/commit/32056368ccf419d6295e85d3c5daf3bdc78e7533))
* **CronJobs:** add isApiReady prop to handle API readiness state in component ([9044c29](https://github.com/think-root/content-sentinel/commit/9044c295ee1044ca393941814b9bfa5d610a7fa8))
* **DashboardLayout:** add isApiReady prop to control pull-to-refresh ([974279e](https://github.com/think-root/content-sentinel/commit/974279e52ea25ccb8b80695af5a79b5f335a6e9e))
* **RepositoryPreview:** add isApiReady prop to handle API readiness state ([dde1b20](https://github.com/think-root/content-sentinel/commit/dde1b20ef378a1715edd5042e22960fbc428d70f))
* **useCache:** add API configuration check before cache validity verification ([7c5dc4a](https://github.com/think-root/content-sentinel/commit/7c5dc4ad29e22f7ef1dbfcc807261388f126a390))
* **useCronJobs:** add API configuration check before error handling in fetchCronJobs ([7192c77](https://github.com/think-root/content-sentinel/commit/7192c77d4e0c53d6ba60da96129ff1a78ca9bcb8))
* **usePreviews:** add API configuration check before error handling in fetchPreviews ([974014c](https://github.com/think-root/content-sentinel/commit/974014c3d773084aab9125c8601f627bcfaea712))
* **useRepositories:** add API configuration check before error handling in fetchRepositories ([ab4ddc3](https://github.com/think-root/content-sentinel/commit/ab4ddc3cdcfc802ddbacc709a51289eb73326ec3))

# [1.23.0](https://github.com/think-root/content-sentinel/compare/v1.22.1...v1.23.0) (2025-04-14)


### Features

* add mobile device detection for pull-to-refresh functionality ([09509a6](https://github.com/think-root/content-sentinel/commit/09509a6b79d17cacb9616e4a274e7ab6043000fc))
* enhance swipe navigation in SettingsModal for mobile devices ([c19dad3](https://github.com/think-root/content-sentinel/commit/c19dad3a285551ed42eadbdd9763c9f5e8e0be26))

## [1.22.1](https://github.com/think-root/content-sentinel/compare/v1.22.0...v1.22.1) (2025-04-14)


### Bug Fixes

* update button width in SettingsModal for better responsiveness ([2a728ef](https://github.com/think-root/content-sentinel/commit/2a728ef481763b1714052bdee3d36408f6ba7089))

# [1.22.0](https://github.com/think-root/content-sentinel/compare/v1.21.0...v1.22.0) (2025-04-14)


### Bug Fixes

* update cache management description in SettingsModal ([3b7de94](https://github.com/think-root/content-sentinel/commit/3b7de946928c4aa9b83622fe74e5ccf26409c282))


### Features

* enhance pull-to-refresh functionality and settings modal integration ([f465537](https://github.com/think-root/content-sentinel/commit/f465537363c09d79abd2fa20eec33480abe266f9))
* enhance SettingsModal with swipe navigation and touch event handling ([131dd04](https://github.com/think-root/content-sentinel/commit/131dd04c98eafc5a54a54be686f9fa38641641d4))

# [1.21.0](https://github.com/think-root/content-sentinel/compare/v1.20.0...v1.21.0) (2025-04-14)


### Features

* implement pull-to-refresh and enhance data caching mechanism ([3df2d8d](https://github.com/think-root/content-sentinel/commit/3df2d8d51f18276995f7877a4cca6d6029369c7b))

# [1.20.0](https://github.com/think-root/content-sentinel/compare/v1.19.0...v1.20.0) (2025-04-14)


### Features

* add cache management tab to settings modal ([e0a0b82](https://github.com/think-root/content-sentinel/commit/e0a0b824fa06def710b72b486dc99b0c79e39cb7))
* add caching utilities for repositories, previews, and cron jobs ([3653c75](https://github.com/think-root/content-sentinel/commit/3653c75c16b37ab10c84032f02ab2bdaa6b10948))
* add function to clear API cache ([700d3d3](https://github.com/think-root/content-sentinel/commit/700d3d3fad7dbcd080220d656b9578bf1bae2b9c))
* **global:** add clearApiCache and clearAllCaches methods to Window interface ([fa7e48d](https://github.com/think-root/content-sentinel/commit/fa7e48da5c860ec2924690b424889b11adf99a67))
* implement caching for repositories, previews, and cron jobs ([dd361c5](https://github.com/think-root/content-sentinel/commit/dd361c5d94b6b75d3c6c5329416d22b3c2dfa1dc))

# [1.19.0](https://github.com/think-root/content-sentinel/compare/v1.18.0...v1.19.0) (2025-04-03)


### Features

* add responsive toast positioning in App component ([04aa958](https://github.com/think-root/content-sentinel/commit/04aa958f6c2c411f2f76a2440285725205fb1bc7))
* auto change toast position based on the window width ([ca65ee0](https://github.com/think-root/content-sentinel/commit/ca65ee0a6173a163b80fb1c13e403e0cab78fc60))
* update toast shadow and remove unused animation ([94bee70](https://github.com/think-root/content-sentinel/commit/94bee70ada8d2d9d344b3f46676827a833399deb))

# [1.18.0](https://github.com/think-root/content-sentinel/compare/v1.17.2...v1.18.0) (2025-04-02)


### Features

* update button layout in GenerateForm ([b59b6ab](https://github.com/think-root/content-sentinel/commit/b59b6ab5cfa931b0b9926f33860572427a35be68))

## [1.17.2](https://github.com/think-root/content-sentinel/compare/v1.17.1...v1.17.2) (2025-04-02)


### Bug Fixes

* ensure all items are fetched when 'All' is selected ([1059c1d](https://github.com/think-root/content-sentinel/commit/1059c1d411825a424ee8a138bc236296a53ada16))

## [1.17.1](https://github.com/think-root/content-sentinel/compare/v1.17.0...v1.17.1) (2025-04-02)


### Bug Fixes

* fix pagination logic for fetchAll ([b1a6b58](https://github.com/think-root/content-sentinel/commit/b1a6b58916bace00d54e54c52017c996a64b0c6b))
* handle edge case for fetchAll in getRepositories ([ff39384](https://github.com/think-root/content-sentinel/commit/ff39384699a81ad2665421f3edad75d9abe90065))

# [1.17.0](https://github.com/think-root/content-sentinel/compare/v1.16.0...v1.17.0) (2025-04-02)


### Features

* add support for 12-hour time format in date formatting ([8916b51](https://github.com/think-root/content-sentinel/commit/8916b51eebcec8fd5a8f94eb77a5b0c58ab6c5a6))
* **SettingsModal:** update UI with icons and improved styling ([13f8fef](https://github.com/think-root/content-sentinel/commit/13f8fef69f4ccb01b39adcd0d7f01f5a0b5849d5))

# [1.16.0](https://github.com/think-root/content-sentinel/compare/v1.15.1...v1.16.0) (2025-04-01)


### Features

* add toast notifications for cron job status updates ([185ea35](https://github.com/think-root/content-sentinel/commit/185ea35569e10912dbc2e2441b83274207a62127))

## [1.15.1](https://github.com/think-root/content-sentinel/compare/v1.15.0...v1.15.1) (2025-04-01)


### Bug Fixes

* remove onUpdate callback in CronJobs component ([6769dfa](https://github.com/think-root/content-sentinel/commit/6769dfa25dbcc984891c6393ce7a58ab9ddb88e6))

# [1.15.0](https://github.com/think-root/content-sentinel/compare/v1.14.1...v1.15.0) (2025-04-01)


### Bug Fixes

* update no data message in RepositoryList component ([95fb223](https://github.com/think-root/content-sentinel/commit/95fb2236584e6df84e87f26b7d700eae70cc70d0))


### Features

* add toast notifications for error handling ([3aaaab1](https://github.com/think-root/content-sentinel/commit/3aaaab18395bc7a605cc033793ad9c8ac2221686))
* **CronJobs:** add toast notifications for API errors ([43e8e32](https://github.com/think-root/content-sentinel/commit/43e8e32458da55419c16aa8a4933a61c03eafee4))
* replace toast with react-hot-toast in Setting ([01b7ee1](https://github.com/think-root/content-sentinel/commit/01b7ee10e0420ba21f1a5866f891812ebe2c69a2))

## [1.14.1](https://github.com/think-root/content-sentinel/compare/v1.14.0...v1.14.1) (2025-04-01)


### Bug Fixes

* remove response status text from error messages ([e70b654](https://github.com/think-root/content-sentinel/commit/e70b6545bc104b59d559dd5f1014c44c6143bd5f))

# [1.14.0](https://github.com/think-root/content-sentinel/compare/v1.13.0...v1.14.0) (2025-04-01)


### Bug Fixes

* enhance pagination handling and improve button styles in RepositoryList component ([c1917be](https://github.com/think-root/content-sentinel/commit/c1917be2563b146c07d93a62afd94c6bf4b7c144))
* implement search functionality in RepositoryList component ([929b9fb](https://github.com/think-root/content-sentinel/commit/929b9fbfbc9ed01ad5956e0860be61de9680023b))
* update request body to include page and pageSize for repository fetching ([7caa070](https://github.com/think-root/content-sentinel/commit/7caa0705ffd980b671d62f5c533865dda50fd104))


### Features

* add loading state for cron jobs ([21b4562](https://github.com/think-root/content-sentinel/commit/21b45624cc637fca9b73773d503100f8ab5636df))

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
