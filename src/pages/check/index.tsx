import { Button, Space, Table, Tag, message } from 'antd'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { FileInfo, Status, UploadList, checkStatus, checkUploadList, getUploadList } from '../../utils/api/onedrive'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function Check() {
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
      title: '上传时间',
      dataIndex: 'createTime',
      align: 'center',
      render: time => dayjs(time || null).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '上传到的目录',
      dataIndex: 'path',
      align: 'center',
      render: (path, item) => (
        <Link target="_blank" href={`/temp/${item.userName}/${decodeURIComponent(path)}`}>
          {decodeURIComponent(path)}
        </Link>
      ),
    },
    {
      title: '上传的文件列表',
      dataIndex: 'fileList',
      align: 'center',
      render: list => list.map((item: FileInfo) => <div key={item.id}>{item.path}</div>),
    },
    {
      title: '备注',
      dataIndex: 'content',
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: status => {
        return (
          <div>
            {status === Status.Approved ? (
              <Tag color="success">通过</Tag>
            ) : status === Status.Rejected ? (
              <Tag color="error">不通过</Tag>
            ) : (
              <Tag color="processing">未审核</Tag>
            )}
          </div>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (val, item) => (
        <Space size="middle">
          <Button onClick={() => handleCheck(item, 'approved')} color="blue">
            通过
          </Button>
          <Button
            onClick={() => handleCheck(item, 'failed')}
            disabled={item.status !== Status.Pending}
            type="primary"
            danger
          >
            不通过
          </Button>
        </Space>
      ),
    },
  ]
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery('fileList', () => getUploadList())

  const { mutate, reset } = useMutation(
    (value: { id: number; status: checkStatus }) => checkUploadList(value.id, value.status),
    {
      onSuccess(res) {
        reset()
        message.success('审核成功')
      },
      onError(e) {
        message.error('审核失败' + e)
      },
      onSettled: (data, error, variables, context) => {
        console.log('onesettled')
        // queryClient.invalidateQueries({
        //   queryKey: 'fileList',
        // })
        refetch()
      },
    }
  )

  async function handleCheck(item: UploadList, status: checkStatus) {
    const { id } = item
    mutate({ id, status })
  }

  // todo：分页

  return <Table dataSource={data?.list || []} loading={isLoading} columns={columns} />
}
