import LegalDocumentEditor from "../../components/legal/LegalDocumentEditor";

export default function TermsCondition() {
  return (
    <LegalDocumentEditor
      pageTitle="Terms & Conditions"
      defaultTitle="Terms & Conditions"
      endpoint="/admin/content/terms-condition"
      enableNotifications
    />
  );
}
