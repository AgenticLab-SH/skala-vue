import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import pluginOxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfig([
  { files: ['**/*.{vue,js,mjs}'] },
  globalIgnores(['**/dist/**', '**/node_modules/**']),
  { languageOptions: { globals: { ...globals.browser } } },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
  {
    name: 'app/custom-rules',
    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  skipFormatting,
])
