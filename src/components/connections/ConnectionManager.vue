<template>
  <div class="connection-manager">
    <div class="cm-header">
      <h2>数据库连接</h2>
      <el-button type="primary" @click="openDialog()">新建连接</el-button>
    </div>

    <el-alert
      class="storage-alert"
      type="info"
      :closable="false"
      show-icon
      title="连接信息保存在后端 data/connections.json 中。"
    />

    <!-- 卡片网格布局，一行4个 -->
    <div class="cards-grid">
      <div
        v-for="conn in connections"
        :key="conn.id"
        class="connection-card"
        @click="onConnect(conn)"
      >
        <div class="card-header">
          <span class="card-title">{{ conn.name }}</span>
        </div>
        <div class="card-body">
          <div class="card-info">
            <span class="label">主机:</span>
            <span class="value">{{ conn.host }}:{{ conn.port }}</span>
          </div>
          <div class="card-info">
            <span class="label">用户名:</span>
            <span class="value">{{ conn.username }}</span>
          </div>
          <div class="card-info" v-if="conn.database">
            <span class="label">数据库:</span>
            <span class="value">{{ conn.database }}</span>
          </div>
        </div>
        <div class="card-footer" @click.stop>
          <el-button size="small" @click="openDialog(conn)">编辑</el-button>
          <el-popconfirm title="确定删除这个连接？" @confirm="onDelete(conn.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑连接' : '新建连接'"
      width="480px"
      destroy-on-close
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="我的服务器" />
        </el-form-item>
        <el-form-item label="主机">
          <el-input v-model="form.host" placeholder="127.0.0.1" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="form.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="数据库">
          <el-input v-model="form.database" placeholder="可选，默认 postgres" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="postgres" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="密码" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :loading="testLoading" @click="onTest">测试连接</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useConnections } from '../../composables/useConnections'
import type { DbConnection } from '../../types'

const emit = defineEmits<{
  connect: [conn: DbConnection]
}>()

const {
  connections,
  fetchConnections,
  createConnection,
  updateConnection,
  deleteConnection,
  testConnectionByForm,
} = useConnections()

const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<string | null>(null)
const saving = ref(false)
const testLoading = ref(false)

const form = reactive({
  name: '',
  host: '127.0.0.1',
  port: 5432,
  database: '',
  username: 'postgres',
  password: '',
})

onMounted(() => {
  fetchConnections()
})

function openDialog(conn?: DbConnection) {
  if (conn) {
    isEdit.value = true
    editId.value = conn.id
    form.name = conn.name
    form.host = conn.host
    form.port = conn.port
    form.database = conn.database || ''
    form.username = conn.username
    form.password = conn.password || ''
  } else {
    isEdit.value = false
    editId.value = null
    form.name = ''
    form.host = '127.0.0.1'
    form.port = 5432
    form.database = ''
    form.username = 'postgres'
    form.password = ''
  }
  dialogVisible.value = true
}

async function onSave() {
  saving.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateConnection(editId.value, form)
      ElMessage.success('连接已保存')
    } else {
      await createConnection(form)
      ElMessage.success('连接已保存')
    }
    dialogVisible.value = false
    await fetchConnections()
  } catch (e: any) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

async function onTest() {
  testLoading.value = true
  try {
    const result = await testConnectionByForm({
      host: form.host,
      port: form.port,
      database: form.database || undefined,
      username: form.username,
      password: form.password,
    })
    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(`连接失败: ${result.error}`)
    }
  } finally {
    testLoading.value = false
  }
}

async function onDelete(id: string) {
  try {
    await deleteConnection(id)
    ElMessage.success('已删除')
  } catch (e: any) {
    ElMessage.error(e.message)
  }
}

function onConnect(conn: DbConnection) {
  emit('connect', conn)
}
</script>

<style scoped>
.connection-manager {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  color: #ccc;
}

.cm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.storage-alert {
  margin-bottom: 16px;
}

.cm-header h2 {
  margin: 0;
  font-size: 20px;
  color: #ccc;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.connection-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.connection-card:hover {
  border-color: #0e639c;
  background: #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  flex: 1;
  margin-bottom: 12px;
}

.card-info {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
}

.card-info .label {
  color: #888;
  flex-shrink: 0;
}

.card-info .value {
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #3d3d3d;
}
</style>
