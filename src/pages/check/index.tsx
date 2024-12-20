import { Button, Space, Table, Tag } from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { closeLoading, showLoading } from '../../components/customized/ui/loading'
import { useToast } from '../../components/customized/ui/message'
import { FileInfo, Status, UploadList, checkStatus, checkUploadList, getUploadList } from '../../utils/api/onedrive'

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
          <Button disabled={item.status !== Status.Pending} onClick={() => handleCheck(item, 'approved')} color="default">
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

  const toast = useToast()

  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery(['fileList', page], () => getUploadList(page))

  const { mutate, reset } = useMutation(
    (value: { id: number; status: checkStatus }) => checkUploadList(value.id, value.status),
    {
      onMutate() {
        showLoading('提交审核中~')
      },
      onSuccess(res) {
        reset()
        closeLoading()
        toast({ message: '审核成功', type: 'success' })
      },
      onError(e: any) {
        closeLoading()
        toast({ message: '审核失败' + e, type: 'error' })
      },
      onSettled: (data, error, variables, context) => {

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

  function handlePaginationChange(page: number, pageSize: number) {
    setPage(page)
  }

  return (
    <Table
      dataSource={data?.list || []}
      loading={isLoading}
      pagination={{ onChange: handlePaginationChange, pageSize: 20, total: data?.total || 0 }}
      columns={columns}
    />
  )
}
