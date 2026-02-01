# [1.43.0](https://github.com/think-root/content-sentinel/compare/v1.42.0...v1.43.0) (2026-02-01)


### Bug Fixes

* Correct string interpolation for hourly chart keys and display dates. ([0bc75ca](https://github.com/think-root/content-sentinel/commit/0bc75cadcdb9eebb2e81fc91c4ad19c1b41f6950))


### Features

* Add sorting for API configurations, prioritizing enabled configs alphabetically, then disabled configs alphabetically. ([2f5f97d](https://github.com/think-root/content-sentinel/commit/2f5f97d375c8846f495357ae69d74db353085933))
* Add system overview charts to visualize cron job history and performance metrics. ([52eca6e](https://github.com/think-root/content-sentinel/commit/52eca6eac6d502ad647b30b2edc865ea047f13bf))
* Implement API configuration caching using localStorage in `useApiConfigs` to improve performance and reduce redundant fetches. ([a9704b2](https://github.com/think-root/content-sentinel/commit/a9704b22ff7f0494e74919328bd97deacf00f426))
* Implement UI for managing API integrations including add, edit, delete, and toggle functionality. ([844964f](https://github.com/think-root/content-sentinel/commit/844964f339bce4a401141b76b6d123ac17b616ee))
* Integrate overview history refresh into the data refresh hook. ([0895af0](https://github.com/think-root/content-sentinel/commit/0895af08acc5f582d130fa84ce4b0cba56d0c062))
* Introduce `useOverviewHistory` hook to centralize overview chart data fetching, state management, and caching. ([f08791e](https://github.com/think-root/content-sentinel/commit/f08791e66c2d21ef85d7bc7efa22f0d203ab1c2b))
* Introduce and visualize a distinct 'partial' job status across overview charts and KPI calculations. ([23b4416](https://github.com/think-root/content-sentinel/commit/23b4416380d56d4de0ee1a8a1282beba7c094c2e))

# [1.42.0](https://github.com/think-root/content-sentinel/compare/v1.41.0...v1.42.0) (2026-01-26)


### Bug Fixes

* **ui:** align warning badge colors with tokens ([d6f8550](https://github.com/think-root/content-sentinel/commit/d6f8550a4d93f0ddc408784c771ad963dd422b2d))


### Features

* Implement detailed error reporting for repository additions and refine max repos input validation and persistence. ([c27f469](https://github.com/think-root/content-sentinel/commit/c27f4699b6c2a6470b11ec2e2195dec8b1e48f51))
* **ui:** add warning variant to badge component ([a3f4b70](https://github.com/think-root/content-sentinel/commit/a3f4b701b52ab6c6a8d6771dd1a220575046947d))
* **ui:** update resource link based on selection ([402df17](https://github.com/think-root/content-sentinel/commit/402df175fa5b8c38eb5f724d8a3c0d4cbd463563))

# [1.41.0](https://github.com/think-root/content-sentinel/compare/v1.40.0...v1.41.0) (2026-01-09)


### Bug Fixes

* **hooks:** update dependency array in useCronJobHistory ([267167f](https://github.com/think-root/content-sentinel/commit/267167fa7a9b433668c20ac55ee23dd9c37290ac))


### Features

* **api:** add new parameters to autoGenerate function ([ba81642](https://github.com/think-root/content-sentinel/commit/ba81642112732cb3c22ccd5f26582c9e57dd9437))
* **dashboard:** update auto-generate function parameters ([53ea7a6](https://github.com/think-root/content-sentinel/commit/53ea7a60c4dbde9988e29922f1d6c900a5895f2f))
* **ui:** enhance generate form with resource selection ([3442c46](https://github.com/think-root/content-sentinel/commit/3442c4618558c4e2a40076d5486b0613ec288c9b))
* **useGenerateHandlers:** enhance autoGenerate function ([93b3557](https://github.com/think-root/content-sentinel/commit/93b3557070e90caf59ae7da381f094e204aec6fa))

# [1.40.0](https://github.com/think-root/content-sentinel/compare/v1.39.0...v1.40.0) (2026-01-04)


### Bug Fixes

* **api:** update endpoint URLs and methods ([813efe4](https://github.com/think-root/content-sentinel/commit/813efe4320891871521a84f982bff622ae97df32))
* update success-foreground color to black ([02347ab](https://github.com/think-root/content-sentinel/commit/02347ab7966026e5664b0bf27b15d7319b420f37))


### Features

* **api:** add generic type to handleLanguageFallback ([498da02](https://github.com/think-root/content-sentinel/commit/498da02d8df9e0d07529f936d7004bc9040141d2))
* **cron-jobs:** add update functionality ([8797376](https://github.com/think-root/content-sentinel/commit/87973767514e9796c5149202a6c5dd7b81ab9adb))
* **prompt-settings:** add unsaved changes notification ([30a55b6](https://github.com/think-root/content-sentinel/commit/30a55b688c7ecc63db714cfd49640259b5547d67))
* **ui:** add switch component for job status ([ca3f4be](https://github.com/think-root/content-sentinel/commit/ca3f4be4d89606ea87c354d3446022820c3451fa))
* **ui:** add unsaved changes indicator for AI Settings ([8a740b2](https://github.com/think-root/content-sentinel/commit/8a740b2e3b5a77080e58af86642ce69876647fb5))

# [1.39.0](https://github.com/think-root/content-sentinel/compare/v1.38.0...v1.39.0) (2025-12-20)


### Bug Fixes

* **hooks:** remove redundant new data notification logic ([9839734](https://github.com/think-root/content-sentinel/commit/9839734a4224217cb290bc5b87a5624ea43c8535))
* Ignore swipe gestures when text is selected in dashboard content. ([fde7447](https://github.com/think-root/content-sentinel/commit/fde7447ddf7710855c0d6075c5d1b572ac3488f1))
* Prevent swipe gestures in settings modal when text is selected. ([646f92a](https://github.com/think-root/content-sentinel/commit/646f92adda8d93fc7f2c5ab8b088438727a709c1))
* **redirects:** correct redirect rule for index.html ([1b31c33](https://github.com/think-root/content-sentinel/commit/1b31c333b245061b8c01f063c31536c9d960f851))
* **redirects:** correct redirect rule syntax ([2ca5887](https://github.com/think-root/content-sentinel/commit/2ca5887786a0a0e3d456a85cd30cd620fd69a7cf))
* **ui:** adjust padding in API settings tab ([f168924](https://github.com/think-root/content-sentinel/commit/f168924a30ae0758db433aed2fe80c7abaca573c))
* **ui:** debounce collect settings autosave ([163fd23](https://github.com/think-root/content-sentinel/commit/163fd23ea4196dbe4468e152dcd41b07159c038c))
* **ui:** improve input field validation UI for language codes ([7133486](https://github.com/think-root/content-sentinel/commit/7133486cbc8584822cc4dd4f575ce5eb6533beb0))
* **ui:** increase prompt textarea min height ([d0b3146](https://github.com/think-root/content-sentinel/commit/d0b314691e4b89e46b062640abe63bb56221a0ce))
* **ui:** normalize timezone handling in cron job display ([a17e005](https://github.com/think-root/content-sentinel/commit/a17e005c82c7d8d6a8a07d39da4f469e512fcf96))
* **ui:** optimize overview tab data fetching logic ([b706698](https://github.com/think-root/content-sentinel/commit/b7066984cecf1ca535c2244c4070f7ca0e9fa60d))
* **ui:** remove redundant data notification toast ([03d9806](https://github.com/think-root/content-sentinel/commit/03d98067a708656cc143165d916b302ebe2166b9))
* **ui:** trim whitespace from date format and timezone inputs ([319f221](https://github.com/think-root/content-sentinel/commit/319f221a11bf5098ee8319166f70b84c79566c00))
* **utils:** improve timezone validation regex and logic ([68a9de1](https://github.com/think-root/content-sentinel/commit/68a9de11435c5c79c1481932b1af943686b8ceed))
* **utils:** normalize timezone handling in date formatting ([9fb6422](https://github.com/think-root/content-sentinel/commit/9fb6422eb9edc57b4804e738e62d96856f745634))


### Features

* **hooks:** add typed storage keys and initializeFromStorage utility ([f556340](https://github.com/think-root/content-sentinel/commit/f5563400757d1a6d87b91e91463a6f9761d41294))
* **hooks:** implement centralized local storage utility and cache validation in useRepositories ([bbb7c14](https://github.com/think-root/content-sentinel/commit/bbb7c14bdfb433ce9ef45656fbeaa3d57cc764ee))
* **redirects:** add redirect rule for index.html ([f04f563](https://github.com/think-root/content-sentinel/commit/f04f563c9d4271584b025a56ccbaf24893e13e98))
* **redirects:** add redirect rules for dashboard ([f21f1bc](https://github.com/think-root/content-sentinel/commit/f21f1bca026363b219f2a3fabde1908671921c7e))
* **redirects:** add wildcard redirect to root ([339b2fc](https://github.com/think-root/content-sentinel/commit/339b2fcbcfdd7d7321e54e481b9ce6e2da361e3c))
* **redirects:** update redirect rules for index.html ([2dd5932](https://github.com/think-root/content-sentinel/commit/2dd5932ed9791ee0920cf58caf611a9f0369e6ce))
* **ui:** add scrollable area to API settings tab ([7f256d0](https://github.com/think-root/content-sentinel/commit/7f256d020504e3242e0d972f279fb996aa4994ea))
* **ui:** enhance mobile swipe and scroll in settings modal ([49ec8d2](https://github.com/think-root/content-sentinel/commit/49ec8d2e814d664b8590637649a16540f7c16ed8))
* update paths in index.html, manifest.json, and routing ([97d5873](https://github.com/think-root/content-sentinel/commit/97d58735e0cc78a136719f6c196fd72d7ce58f58))
* **utils:** add timezone normalization and aliasing functions ([c3e3256](https://github.com/think-root/content-sentinel/commit/c3e3256d06fc150c10fd8ce1461621280f0d900b))


### Performance Improvements

* **hooks:** run data refresh calls concurrently without delays ([41b8114](https://github.com/think-root/content-sentinel/commit/41b81142948fd9afa06202dc40f4a324504ea0bf))

# [1.38.0](https://github.com/think-root/content-sentinel/compare/v1.37.0...v1.38.0) (2025-10-13)


### Bug Fixes

* **hooks:** prevent duplicate fetches and add loading watchdog ([5a9908f](https://github.com/think-root/content-sentinel/commit/5a9908ff7a42f564eb713cba31c3390b529bf685))
* **hooks:** remove redundant check for newDataAvailable in applyNewData ([e358944](https://github.com/think-root/content-sentinel/commit/e3589446f2b4955ea6129a008155dfe9b07a6a43))
* **hooks:** remove ukrainian localization from prompt settings content ([5c09e4d](https://github.com/think-root/content-sentinel/commit/5c09e4d3cfea6f2c941b3660bccaf14fca2b3254))
* **hooks:** simplify applyNewData logic by removing redundant check ([7ed5562](https://github.com/think-root/content-sentinel/commit/7ed556217418458f8858adfd8e2e060212da9881))
* **ui:** normalize language codes to lowercase ([18526e5](https://github.com/think-root/content-sentinel/commit/18526e50c3b5ba4dd44095ba8dbf8b18a4f990b4))
* **ui:** rehydrate settings on open and reset UI ([b2e9322](https://github.com/think-root/content-sentinel/commit/b2e93225c8671b09d05bee9911008d7ae1b38ea9))
* **useCronJobHistory:** respect explicit undefined overrides and preserve pageSize on filter changes ([89af84b](https://github.com/think-root/content-sentinel/commit/89af84b2517f8941a1eb348383eefbf8e00364b2))


### Features

* **api:** add language caching and fallback handling ([ce9bfce](https://github.com/think-root/content-sentinel/commit/ce9bfce503ea985d4e360409dffb2aa7c9855a95))
* **config:** add slide fade-in animations to tailwind config ([527833e](https://github.com/think-root/content-sentinel/commit/527833e288cddeb2da10efef5a19224b547c5b25))
* **hooks:** add language-aware caching and error handling for repository data ([249b131](https://github.com/think-root/content-sentinel/commit/249b131e3e9d2f91d0d907409e25b10664a141d7))
* **hooks:** persist and load dashboard filter settings from local storage ([ed4ca74](https://github.com/think-root/content-sentinel/commit/ed4ca74a068703458a6a3af533ec74cf0043d92e))
* **hooks:** refetch repositories with saved dashboard filters ([0c683fc](https://github.com/think-root/content-sentinel/commit/0c683fc23a6c3cfa38228131fbdb4bb8611b69c5))
* **settings:** add display language configuration with default value ([a8ae2d8](https://github.com/think-root/content-sentinel/commit/a8ae2d862227ef845f6dd9b1a980077d14547a41))
* **settings:** add display language validation with caching and UI feedback ([064654b](https://github.com/think-root/content-sentinel/commit/064654b10adec836b5b26eb04d45590dfff925f5))
* **ui:** add date/timezone validation to settings modal ([399d694](https://github.com/think-root/content-sentinel/commit/399d694715ec2b065ae11eaa758f48b8c18f68d3))
* **ui:** add mobile swipe animations to dashboard ([a10c280](https://github.com/think-root/content-sentinel/commit/a10c280d53830e5b433b552da257e58df6c899d5))
* **ui:** add mobile swipe navigation to dashboard tabs ([a0ba0d1](https://github.com/think-root/content-sentinel/commit/a0ba0d1d1cfc543cf001f25c25d7a414e39e7368))
* **ui:** add no‑op save detection to settings modal ([8f2acab](https://github.com/think-root/content-sentinel/commit/8f2acabf968376f80554caa1f5e7b28312501cf8))
* **ui:** add saving state and spinner to settings modal ([4f3f484](https://github.com/think-root/content-sentinel/commit/4f3f484b2163d044badb54dfb49804a8aea88552))
* **ui:** add settings-saved listener to trigger refresh ([ea3edb3](https://github.com/think-root/content-sentinel/commit/ea3edb3ba8a2cbb63274cc58b123f9d8b4bd1eca))
* **ui:** add swipe animations to settings modal ([77126ed](https://github.com/think-root/content-sentinel/commit/77126ede0b717e427f10ace6bfdbb01f8c674fe9))
* **ui:** dispatch settings-saved event and disable toasts ([5154b5d](https://github.com/think-root/content-sentinel/commit/5154b5dc683271553fb97df94719bb630b5b2c63))

# [1.37.0](https://github.com/think-root/content-sentinel/compare/v1.36.0...v1.37.0) (2025-09-30)


### Bug Fixes

* **api:** validate start_date and end_date parameters ([01aef79](https://github.com/think-root/content-sentinel/commit/01aef79da92789a471c91faf095bf9e245c78489))
* **language-validation:** allow validation to pass on API failure ([9936f29](https://github.com/think-root/content-sentinel/commit/9936f2985f4f19ee84e66bcdede9092778692a04))


### Features

* add refresh indicator component for loading state ([aa95bf1](https://github.com/think-root/content-sentinel/commit/aa95bf187f8fc856d5f6eb01ad4e958a75ff1f1e))
* **api:** implement request queuing and signature generation ([436db80](https://github.com/think-root/content-sentinel/commit/436db807cea2394192b3e84e4ed0d5a56beb4df9))
* **cache:** enhance caching mechanisms and add expiry checks ([9a65838](https://github.com/think-root/content-sentinel/commit/9a65838054c68981499f4c876b57fd3bb0b44f8a))
* **cache:** improve cache validation and fetching logic ([ef7a762](https://github.com/think-root/content-sentinel/commit/ef7a7627ecbfe630fb47f07ce6ec246c042ec419))
* **cron-job-history:** add stale state management and improve caching logic ([be7c32e](https://github.com/think-root/content-sentinel/commit/be7c32e9b290afe097db9727a40386d4934ba451))
* **cron-jobs:** enhance state management and caching logic ([3f67757](https://github.com/think-root/content-sentinel/commit/3f6775772f6cc8da977515069dbf60eec1d30390))
* **data-refresh:** enhance manual refresh logic and error handling ([83c63c9](https://github.com/think-root/content-sentinel/commit/83c63c947e2e328f5539bfd78966b293f73747a2))
* **hooks:** improve handling of date filters in cron job history ([34ad0c7](https://github.com/think-root/content-sentinel/commit/34ad0c75b645cd842cf68d7cc9a185da751343ba))
* **previews:** enhance previews fetching and caching logic ([195a5fa](https://github.com/think-root/content-sentinel/commit/195a5fa78520514c19ee990bc8670376a6359201))
* **repositories:** enhance repository fetching logic and state management ([c4cbd17](https://github.com/think-root/content-sentinel/commit/c4cbd17d70bd1c6ad2103ef4fba2abd7d362d4ea))
* **request-queue:** implement centralized request queue for API handling ([7f8fba9](https://github.com/think-root/content-sentinel/commit/7f8fba9f2a1410aab69ef6cea298a15a9ecd8ba6))
* **settings:** enhance prompt settings fetching and caching logic ([98a6ce6](https://github.com/think-root/content-sentinel/commit/98a6ce6285b2e243072fdcb5a9a0264a5f67dbf4))
* **tabs:** add tab persistence hook for dashboard ([79735b8](https://github.com/think-root/content-sentinel/commit/79735b877cb3755cd81e513ea48d987117f7e4d1))
* **ui:** enhance color variables and component styles ([95dbffb](https://github.com/think-root/content-sentinel/commit/95dbffbeb1485dc32bde0ede9a57b79ec61ce81d))
* **ui:** enhance date filtering in cron job history ([bcbad59](https://github.com/think-root/content-sentinel/commit/bcbad59bf136f553264fbab445f3fff67b5d1d34))
* update dependencies and enhance Tailwind CSS configuration ([971ed61](https://github.com/think-root/content-sentinel/commit/971ed61e709a3f8f0901c9b51b22025daef93327))
* **utils:** add formatDateOnly function for date formatting ([ebf8cc0](https://github.com/think-root/content-sentinel/commit/ebf8cc0a8ec3ded027e76508cc80c9eeffdf7788))
* **utils:** add formatDateOnly function for date-only formatting ([f081562](https://github.com/think-root/content-sentinel/commit/f081562808b14b5ef80a4b42ab89392aac1aed31))
* **utils:** add utility function for class name merging ([6711701](https://github.com/think-root/content-sentinel/commit/6711701f42bf7eb9d30cb6bff6b998388cb81cf2))

# [1.36.0](https://github.com/think-root/content-sentinel/compare/v1.35.0...v1.36.0) (2025-09-26)


### Bug Fixes

* **ui:** standardize result dialog titles and link display ([5237bdf](https://github.com/think-root/content-sentinel/commit/5237bdfd41f9fd637d16a011c28d5e6a7d02e9c9))


### Features

* **ui:** add chutes provider to LLM providers list ([9a9fa56](https://github.com/think-root/content-sentinel/commit/9a9fa563aede4d5026294d6d93fa883489646ed9))
* **ui:** add context-aware result dialog with dynamic titles and content ([bcd840c](https://github.com/think-root/content-sentinel/commit/bcd840c6c0273496315cc9599891a2e128f6331d))
* **ui:** add github repository url validation and error handling ([41a3078](https://github.com/think-root/content-sentinel/commit/41a3078fbf89920c64bfd3346cdeba65ea14016b))
* **ui:** always show result dialog after auto generation ([0ae5a95](https://github.com/think-root/content-sentinel/commit/0ae5a95db054f46d73963896d4f9bf29001173f4))

# [1.35.0](https://github.com/think-root/content-sentinel/compare/v1.34.0...v1.35.0) (2025-08-25)


### Features

* **api:** add error_message field to ManualGenerateResponse interface ([7d3c837](https://github.com/think-root/content-sentinel/commit/7d3c837ec7e53f7f3d045b0aeaa5600bd5c10b6b))
* **ui:** add error message display in result dialog ([0a5a0c0](https://github.com/think-root/content-sentinel/commit/0a5a0c0970bdd8db3bc9c14b5202822fce8cb271))
* **ui:** implement error message handling in result dialog ([c6f96ef](https://github.com/think-root/content-sentinel/commit/c6f96ef22f157004334d1453cbbab0863922b9ce))

# [1.34.0](https://github.com/think-root/content-sentinel/compare/v1.33.1...v1.34.0) (2025-08-08)


### Features

* **ui:** update table layout and truncate output text ([7ace911](https://github.com/think-root/content-sentinel/commit/7ace91128e3d9d184f90a7844a8958fe41547476))

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
