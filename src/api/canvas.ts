import http from '@/api/http'
import type {
  CanvasProject,
  GeneratePayload,
  GenerateResult,
} from '@/types/canvas'

const MOCK_DELAY_MS = 1200

/** 本地 mock：无后端时模拟生成 */
async function mockGenerate(payload: GeneratePayload): Promise<GenerateResult> {
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS))
  const prefix: Record<GeneratePayload['kind'], string> = {
    text: '已生成文本：',
    image: '已生成图片：',
    video: '已生成视频：',
  }
  return {
    nodeId: payload.nodeId,
    content: `${prefix[payload.kind]}${payload.prompt}`,
    status: 'success',
  }
}

export const canvasApi = {
  async listProjects(): Promise<CanvasProject[]> {
    try {
      const { data } = await http.get<CanvasProject[]>('/projects')
      if (!Array.isArray(data) || !data.every(isCanvasProject)) {
        return getDefaultProjects()
      }
      return data
    } catch {
      return getDefaultProjects()
    }
  },

  async getProject(id: string): Promise<CanvasProject> {
    try {
      const { data } = await http.get<CanvasProject>(`/projects/${id}`)
      if (!isCanvasProject(data)) {
        const found = getDefaultProjects().find(p => p.id === id)
        if (found) return found
        throw new Error('项目不存在')
      }
      return data
    } catch {
      const found = getDefaultProjects().find(p => p.id === id)
      if (found) return found
      throw new Error('项目不存在')
    }
  },

  async saveProject(project: CanvasProject): Promise<CanvasProject> {
    try {
      const { data } = await http.put<CanvasProject>(
        `/projects/${project.id}`,
        project,
      )
      return data
    } catch {
      localStorage.setItem(
        `canvas_project_${project.id}`,
        JSON.stringify(project),
      )
      return project
    }
  },

  async generate(payload: GeneratePayload): Promise<GenerateResult> {
    try {
      const { data } = await http.post<GenerateResult>('/generate', payload)
      return data
    } catch {
      return mockGenerate(payload)
    }
  },
}

function isCanvasProject(value: unknown): value is CanvasProject {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<CanvasProject>
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    Array.isArray(project.nodes) &&
    Array.isArray(project.edges)
  )
}

function getDefaultProjects(): CanvasProject[] {
  return [
    {
      id: 'default',
      name: '默认画布',
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: '1',
          type: 'ai',
          position: { x: 100, y: 100 },
          data: {
            kind: 'text',
            title: '提示词节点',
            content: '节点内笔记，双击编辑',
            prompt: '帮我生成一个赛博朋克城市',
          },
        },
        {
          id: '2',
          type: 'ai',
          position: { x: 500, y: 250 },
          data: {
            kind: 'image',
            title: '图片生成节点',
            content: '',
            prompt: '',
          },
        },
        {
          id: '3',
          type: 'ai',
          position: { x: 900, y: 120 },
          data: {
            kind: 'video',
            title: '视频生成节点',
            content: '',
            prompt: '',
          },
        },
        {
          id: '4',
          type: 'ai',
          position: { x: 200, y: 450 },
          data: {
            kind: 'image',
            title: '图片节点',
            content: '',
            prompt: '',
          },
        },
        {
          id: '5',
          type: 'ai',
          position: { x: 520, y: 450 },
          data: {
            kind: 'video',
            title: '视频节点',
            content: '',
            prompt: '',
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-3', source: '2', target: '3', animated: true },
      ],
    },
    {
      id: 'demo-2',
      name: '空白画布',
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    },
  ]
}
