import { FormInstance } from "antd";
import { DocDocument } from "../../../../api/docDocumentApi";

export interface StepContent {
    form: FormInstance;
    personalDocEdit: DocDocument | null;
    handleSave?: ((values: any) => void | Promise<void>) | undefined;
    open :boolean | false;
}