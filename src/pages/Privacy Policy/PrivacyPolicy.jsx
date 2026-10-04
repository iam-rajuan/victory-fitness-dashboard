import LegalDocumentEditor from "../../components/legal/LegalDocumentEditor";

export default function PrivacyPolicy() {
  return (
    <LegalDocumentEditor
      pageTitle="Privacy Policy"
      defaultTitle="Privacy Policy"
      endpoint="/admin/content/privacy-policy"
      enableNotifications
    />
  );
}
