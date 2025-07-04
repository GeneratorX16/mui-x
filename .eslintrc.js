const baseline = require('@mui/monorepo/.eslintrc');
const path = require('path');

const CHARTS_PACKAGES = ['x-charts', 'x-charts-pro', 'x-charts-premium'];
const GRID_PACKAGES = [
  'x-data-grid',
  'x-data-grid-pro',
  'x-data-grid-premium',
  'x-data-grid-generator',
];
const PICKERS_PACKAGES = ['x-date-pickers', 'x-date-pickers-pro'];
const TREE_VIEW_PACKAGES = ['x-tree-view', 'x-tree-view-pro'];
const SCHEDULER_PACKAGES = ['x-scheduler'];

// Enable React Compiler Plugin rules globally
const ENABLE_REACT_COMPILER_PLUGIN = process.env.ENABLE_REACT_COMPILER_PLUGIN ?? false;

// Enable React Compiler Plugin rules per package
const ENABLE_REACT_COMPILER_PLUGIN_CHARTS = process.env.ENABLE_REACT_COMPILER_PLUGIN_CHARTS ?? true;
const ENABLE_REACT_COMPILER_PLUGIN_DATA_GRID =
  process.env.ENABLE_REACT_COMPILER_PLUGIN_DATA_GRID ?? false;
const ENABLE_REACT_COMPILER_PLUGIN_DATE_PICKERS =
  process.env.ENABLE_REACT_COMPILER_PLUGIN_DATE_PICKERS ?? false;
const ENABLE_REACT_COMPILER_PLUGIN_TREE_VIEW =
  process.env.ENABLE_REACT_COMPILER_PLUGIN_TREE_VIEW ?? true;
const ENABLE_REACT_COMPILER_PLUGIN_SCHEDULER =
  process.env.ENABLE_REACT_COMPILER_PLUGIN_SCHEDULER ?? true;

const isAnyReactCompilerPluginEnabled =
  ENABLE_REACT_COMPILER_PLUGIN ||
  ENABLE_REACT_COMPILER_PLUGIN_CHARTS ||
  ENABLE_REACT_COMPILER_PLUGIN_DATA_GRID ||
  ENABLE_REACT_COMPILER_PLUGIN_DATE_PICKERS ||
  ENABLE_REACT_COMPILER_PLUGIN_TREE_VIEW;

const addReactCompilerRule = (packagesNames, isEnabled) =>
  !isEnabled
    ? []
    : packagesNames.map((packageName) => ({
        files: [`packages/${packageName}/src/**/*.?(c|m)[jt]s?(x)`],
        rules: {
          'react-compiler/react-compiler': 'error',
        },
      }));

const RESTRICTED_TOP_LEVEL_IMPORTS = [
  '@mui/material',
  '@mui/utils',
  '@mui/x-charts',
  '@mui/x-charts-pro',
  '@mui/x-charts-premium',
  '@mui/x-codemod',
  '@mui/x-date-pickers',
  '@mui/x-date-pickers-pro',
  '@mui/x-tree-view',
  '@mui/x-tree-view-pro',
];

// TODO move this helper to @mui/monorepo/.eslintrc
// It needs to know about the parent "no-restricted-imports" to not override them.
const buildPackageRestrictedImports = (packageName, root, allowRootImports = true) => [
  {
    files: [`packages/${root}/src/**/*.?(c|m)[jt]s?(x)`],
    excludedFiles: [
      '*.d.ts',
      '*.spec.ts',
      '*.spec.tsx',
      '**.test.tx',
      '**.test.tsx',
      `packages/${root}/src/index{.ts,.tsx,.js}`,
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: RESTRICTED_TOP_LEVEL_IMPORTS.map((pkName) => ({
            name: pkName,
            message: 'Use relative import instead',
          })),
          patterns: [
            // TODO move rule into main repo to allow deep @mui/monorepo imports
            {
              group: ['@mui/*/*/*'],
              message: 'Use less deep import instead',
            },
            {
              group: [`${packageName}/*`, `${packageName}/**`],
              message: 'Use relative import instead',
            },
          ],
        },
      ],
    },
  },
  ...(allowRootImports
    ? []
    : [
        {
          files: [
            `packages/${root}/src/**/*.test.?(c|m)[jt]s?(x)`,
            `packages/${root}/src/**/*.spec.?(c|m)[jt]s?(x)`,
          ],
          excludedFiles: ['*.d.ts'],
          rules: {
            'no-restricted-imports': [
              'error',
              {
                paths: RESTRICTED_TOP_LEVEL_IMPORTS.map((name) => ({
                  name,
                  message: 'Use deeper import instead',
                })),
              },
            ],
          },
        },
      ]),
];

const mochaPluginOverride = baseline.overrides.find((override) =>
  override.extends?.includes('plugin:mocha/recommended'),
);

module.exports = {
  ...baseline,
  plugins: [
    ...baseline.plugins,
    'eslint-plugin-jsdoc',
    ...(isAnyReactCompilerPluginEnabled ? ['eslint-plugin-react-compiler'] : []),
  ],
  settings: {
    'import/resolver': {
      webpack: {
        config: path.join(__dirname, './webpackBaseConfig.js'),
      },
    },
  },
  /**
   * Sorted alphanumerically within each group. built-in and each plugin form
   * their own groups.
   */
  rules: {
    ...baseline.rules,
    ...(ENABLE_REACT_COMPILER_PLUGIN ? { 'react-compiler/react-compiler': 'error' } : {}),
    // TODO move to @mui/monorepo, codebase is moving away from default exports https://github.com/mui/material-ui/issues/21862
    'import/prefer-default-export': 'off',
    'import/no-relative-packages': 'error',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          ...CHARTS_PACKAGES,
          ...PICKERS_PACKAGES,
          ...TREE_VIEW_PACKAGES,
          ...SCHEDULER_PACKAGES,
        ].map((packageName) => ({
          target: `./packages/${packageName}/src/**/!(*.test.*|*.spec.*)`,
          from: `./packages/${packageName}/src/internals/index.ts`,
          message: `Use a more specific import instead. E.g. import { MyInternal } from '../internals/MyInternal';`,
        })),
      },
    ],
    // TODO move rule into the main repo once it has upgraded
    '@typescript-eslint/return-await': 'off',
    'no-restricted-imports': 'off',
    // TODO move to @mui/monorepo/.eslintrc
    'jsdoc/require-param': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-param-type': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-param-name': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-param-description': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-returns': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-returns-type': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/require-returns-description': ['error', { contexts: ['TSFunctionType'] }],
    'jsdoc/no-bad-blocks': [
      'error',
      {
        ignore: [
          'ts-check',
          'ts-expect-error',
          'ts-ignore',
          'ts-nocheck',
          'typescript-to-proptypes-ignore',
        ],
      },
    ],
    // Fixes false positive when using both `inputProps` and `InputProps` on the same example
    // See https://stackoverflow.com/questions/42367236/why-am-i-getting-this-warning-no-duplicate-props-allowed-react-jsx-no-duplicate
    // TODO move to @mui/monorepo/.eslintrc
    // TODO Fix <Input> props names to not conflict
    'react/jsx-no-duplicate-props': [1, { ignoreCase: false }],
    // TODO move to @mui/monorepo/.eslintrc, these are false positive
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
  },
  overrides: [
    ...baseline.overrides.filter(
      (override) => !override.extends?.includes('plugin:mocha/recommended'),
    ),
    {
      ...mochaPluginOverride,
      extends: [],
      rules: Object.entries(mochaPluginOverride.rules).reduce((acc, [key, value]) => {
        if (!key.includes('mocha')) {
          acc[key] = value;
        }
        return acc;
      }, {}),
    },
    {
      files: [
        // matching the pattern of the test runner
        '*.test.js',
        '*.test.ts',
        '*.test.tsx',
      ],
      excludedFiles: ['test/e2e/**/*', 'test/regressions/**/*'],
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/no-container': 'off',
      },
    },
    {
      files: [
        // matching the pattern of the test runner
        '*.test.js',
        '*.test.ts',
        '*.test.tsx',
        'test/**',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: ['@testing-library/react', 'test/utils/index'],
          },
        ],
      },
    },
    {
      files: [
        'packages/x-data-grid/**/*{.tsx,.ts,.js}',
        'packages/x-data-grid-pro/**/*{.tsx,.ts,.js}',
        'packages/x-data-grid-premium/**/*{.tsx,.ts,.js}',
        'docs/src/pages/**/*.tsx',
      ],
      rules: {
        'material-ui/no-direct-state-access': 'error',
      },
      parserOptions: { tsconfigRootDir: __dirname, project: ['./tsconfig.json'] },
    },
    // TODO remove, shouldn't disable prop-type generation rule.
    // lot of public components are missing it.
    {
      files: ['*.tsx'],
      excludedFiles: '*.spec.tsx',
      rules: {
        'react/prop-types': 'off',
      },
    },
    {
      files: ['**/*.mjs'],
      rules: {
        'import/extensions': ['error', 'ignorePackages'],
      },
    },
    {
      files: ['packages/*/src/**/*.?(c|m)[jt]s?(x)'],
      excludedFiles: ['*.d.ts', '*.spec.*', '*.test.*'],
      rules: {
        'material-ui/mui-name-matches-component-name': [
          'error',
          {
            customHooks: [
              'useDatePickerProcessedProps',
              'useDatePickerDefaultizedProps',
              'useTimePickerDefaultizedProps',
              'useDateTimePickerDefaultizedProps',
              'useDateRangePickerDefaultizedProps',
              'useDateTimeRangePickerDefaultizedProps',
              'useTimeRangePickerDefaultizedProps',
              'useDateCalendarDefaultizedProps',
              'useMonthCalendarDefaultizedProps',
              'useYearCalendarDefaultizedProps',
              'useDateRangeCalendarDefaultizedProps',
            ],
          },
        ],
        'material-ui/disallow-react-api-in-server-components': 'error',
      },
    },
    {
      files: ['docs/**/*.?(c|m)[jt]s?(x)'],
      excludedFiles: ['*.d.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: RESTRICTED_TOP_LEVEL_IMPORTS.map((name) => ({
              name,
              message: 'Use deeper import instead',
            })),
            patterns: [
              {
                group: [
                  '@mui/*/*/*',
                  // Allow any import depth with any internal packages
                  '!@mui/internal-*/**',

                  // The scheduler import strategy is not determined yet
                  '!@mui/x-scheduler/**',

                  // Exceptions (QUESTION: Keep or remove?)
                  '!@mui/x-data-grid/internals/demo',
                  '!@mui/x-date-pickers/internals/demo',
                  '!@mui/x-tree-view/hooks/useTreeViewApiRef',
                  // TODO: export this from /ButtonBase in core. This will break after we move to package exports
                  '!@mui/material/ButtonBase/TouchRipple',
                ],
                message: 'Use less deep import instead',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/x-telemetry/**/*{.tsx,.ts,.js}'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['packages/x-scheduler/**/*{.tsx,.ts,.js}'],
      rules: {
        // Base UI lint rules
        '@typescript-eslint/no-redeclare': 'off',
        'import/export': 'off',
        'material-ui/straight-quotes': 'off',
        'jsdoc/require-param': 'off',
        'jsdoc/require-returns': 'off',
      },
    },
    ...buildPackageRestrictedImports('@mui/x-charts', 'x-charts', false),
    ...buildPackageRestrictedImports('@mui/x-charts-pro', 'x-charts-pro', false),
    ...buildPackageRestrictedImports('@mui/x-charts-premium', 'x-charts-premium', false),
    ...buildPackageRestrictedImports('@mui/x-codemod', 'x-codemod', false),
    ...buildPackageRestrictedImports('@mui/x-data-grid', 'x-data-grid'),
    ...buildPackageRestrictedImports('@mui/x-data-grid-pro', 'x-data-grid-pro'),
    ...buildPackageRestrictedImports('@mui/x-data-grid-premium', 'x-data-grid-premium'),
    ...buildPackageRestrictedImports('@mui/x-data-grid-generator', 'x-data-grid-generator'),
    ...buildPackageRestrictedImports('@mui/x-date-pickers', 'x-date-pickers', false),
    ...buildPackageRestrictedImports('@mui/x-date-pickers-pro', 'x-date-pickers-pro', false),
    ...buildPackageRestrictedImports('@mui/x-tree-view', 'x-tree-view', false),
    ...buildPackageRestrictedImports('@mui/x-tree-view-pro', 'x-tree-view-pro', false),
    ...buildPackageRestrictedImports('@mui/x-license', 'x-license'),
    ...buildPackageRestrictedImports('@mui/x-telemetry', 'x-telemetry'),

    ...addReactCompilerRule(CHARTS_PACKAGES, ENABLE_REACT_COMPILER_PLUGIN_CHARTS),
    ...addReactCompilerRule(GRID_PACKAGES, ENABLE_REACT_COMPILER_PLUGIN_DATA_GRID),
    ...addReactCompilerRule(PICKERS_PACKAGES, ENABLE_REACT_COMPILER_PLUGIN_DATE_PICKERS),
    ...addReactCompilerRule(TREE_VIEW_PACKAGES, ENABLE_REACT_COMPILER_PLUGIN_TREE_VIEW),
    ...addReactCompilerRule(SCHEDULER_PACKAGES, ENABLE_REACT_COMPILER_PLUGIN_SCHEDULER),

    // We can't use the react-compiler plugin in the base-ui-utils folder because the Base UI team doesn't use it yet.
    {
      files: ['packages/x-scheduler/src/base-ui-copy/**/*{.tsx,.ts,.js}'],
      rules: {
        'react-compiler/react-compiler': 'off',
      },
    },
  ],
};
