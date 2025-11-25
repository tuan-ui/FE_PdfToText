import { TransferItem } from "antd/es/transfer";

export interface UserType extends TransferItem {
    username: string;
    userCode?: string;
    fullName?: string;
}