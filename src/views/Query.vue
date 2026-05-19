<template>
  <div class="query-view">
    <EditorToolbar @run="runQuery" :loading="queryLoading" />
    <SqlEditor ref="editorRef" @run="runQuery" />
    <ResultStatus v-if="queryResult" :result="queryResult" />
    <ResultTable v-if="queryResult" :result="queryResult" />
    <div v-if="queryError" class="query-error">
      <el-alert :title="queryError" type="error" :closable="false" show-icon />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SqlEditor from '../components/editor/SqlEditor.vue'
import EditorToolbar from '../components/editor/EditorToolbar.vue'
import ResultTable from '../components/results/ResultTable.vue'
import ResultStatus from '../components/results/ResultStatus.vue'
import { useQuery } from '../composables/useQuery'

const editorRef = ref<InstanceType<typeof SqlEditor>>()
const { loading: queryLoading, result: queryResult, error: queryError, execute } = useQuery()

function runQuery() {
  const sql = editorRef.value?.getValue() || ''
  if (sql.trim()) {
    execute(sql)
  }
}
</script>

<style scoped>
.query-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.query-error {
  margin-top: 8px;
}
</style>
