import { Button, Space, Table, Tag } from 'antd'
import { useQuery } from 'react-query'
import { UploadList, getUploadList } from '../../utils/api/onedrive'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const columns: ColumnsType<UploadList> = [
  {
    title: 'id',
    dataIndex: 'id',
    align: 'center',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
    align: 'center',
  },
  {
    title: 'qq',
    dataIndex: 'userName',
    align: 'center',
  },
  {
    title: 'createTime',
    dataIndex: '上传时间',
    render: time => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '上传到的目录',
    dataIndex: 'path',
    align: 'center',
  },
  {
    title: '备注',
    dataIndex: 'content',
  },
  {
    title: '状态',
    dataIndex: 'isApproved',
    render: status => {
      return (
        <div>
          {status === 'approved' ? <Tag>通过</Tag> : status === 'rejected' ? <Tag>不通过</Tag> : <Tag>未审核</Tag>}
        </div>
      )
    },
  },
  {
    title: 'Action',
    key: 'action',
    sorter: true,
    render: () => (
      <Space size="middle">
        <a>
          <Button>通过</Button>
          <Button>不通过</Button>
        </a>
      </Space>
    ),
  },
]

export default function Check() {
  const { data, isLoading } = useQuery('fileList', () => getUploadList())

  return <Table loading={isLoading} columns={columns} />
}
