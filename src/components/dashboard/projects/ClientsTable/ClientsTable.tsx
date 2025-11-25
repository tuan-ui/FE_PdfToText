import { Table, type TableProps } from "antd";

interface Clients {
  id: number;
  first_name: string;
  last_name: string;
}

interface Props extends TableProps<Clients> {
  data: Clients[];
}

export const ClientsTable = ({ data, ...others }: any) => (
  <Table
    rowKey="id"
    dataSource={data}
    size="middle"
    className="overflow-scroll"
    {...others}
  />
);