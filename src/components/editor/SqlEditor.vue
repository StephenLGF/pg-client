<template>
  <div ref="containerRef" class="sql-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useTheme } from '../../composables/useTheme'

const emit = defineEmits<{
  run: []
}>()

const containerRef = ref<HTMLElement>()
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const { theme } = useTheme()

function getMonacoTheme(): string {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? 'vs-dark' : 'vs'
}

function getValue(): string {
  return editor?.getValue() || ''
}

defineExpose({ getValue })

onMounted(() => {
  if (!containerRef.value) return

  monaco.languages.register({ id: 'pgsql' })
  monaco.languages.setMonarchTokensProvider('pgsql', {
    ignoreCase: true,
    tokenizer: {
      root: [
        [
          /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|VIEW|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|NULL|IS|IN|AS|SET|VALUES|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MAX|MIN|CASE|WHEN|THEN|ELSE|END|BEGIN|COMMIT|ROLLBACK|GRANT|REVOKE|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|CHECK|UNIQUE|EXISTS|BETWEEN|LIKE|ILIKE|ASC|DESC|CASCADE|RESTRICT|ADD|COLUMN|IF|REPLACE|FUNCTION|RETURNS|LANGUAGE|PLPGSQL|DECLARE|RETURN|EXECUTE|VOLATILE|STABLE|IMMUTABLE|STRICT|SECURITY|DEFINER|INVOKER|OWNER|PROCEDURE|TRIGGER|BEFORE|AFTER|EACH|ROW|STATEMENT|OF|TO|USING|WITH|RECURSIVE|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|COALESCE|NULLIF|GREATEST|LEAST|CAST|TYPE|DOMAIN|ENUM|EXTENSION|SCHEMA|DATABASE|SERIAL|BIGSERIAL|INTEGER|BIGINT|SMALLINT|TEXT|VARCHAR|BOOLEAN|TIMESTAMP|DATE|TIME|NUMERIC|REAL|DOUBLE|PRECISION|UUID|JSON|JSONB|BYTEA|INET|ARRAY|INTERVAL)\b/i,
          'keyword',
        ],
        [/--.*$/, 'comment'],
        [/\/\*[\s\S]*?\*\//, 'comment'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, 'string', '@string'],
        [/\d+(\.\d+)?/, 'number'],
        [/[;,.()\[\]]/, 'delimiter'],
      ],
      string: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  })

  editor = monaco.editor.create(containerRef.value, {
    value: '-- Write your SQL here\nSELECT 1;\n',
    language: 'pgsql',
    theme: getMonacoTheme(),
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    automaticLayout: true,
    tabSize: 2,
    scrollBeyondLastLine: false,
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    emit('run')
  })
})

watch(theme, () => {
  if (editor) {
    monaco.editor.setTheme(getMonacoTheme())
  }
})

onUnmounted(() => {
  editor?.dispose()
})
</script>

<style scoped>
.sql-editor {
  flex: 1;
  min-height: 200px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}
</style>
