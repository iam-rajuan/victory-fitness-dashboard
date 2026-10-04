import LegalDocumentEditor from "../../components/legal/LegalDocumentEditor";

export default function AboutUs() {
  return (
    <LegalDocumentEditor
      pageTitle="About Us"
      defaultTitle="About Us"
      endpoint="/admin/content/about-us"
      enableNotifications={false}
    />
  );
}
