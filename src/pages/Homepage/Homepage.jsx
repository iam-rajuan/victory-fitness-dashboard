import { Button, Card, Col, Form, Input, Row, Switch, Table, Tabs, message } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiRefreshCw, FiSave } from "react-icons/fi";
import { addAdminHomepageQuote, listAdminHomepageQuotes, replaceAdminHomepageQuotes } from "../../../services/admin-content.service";

function SummaryCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

export default function Homepage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const quoteResponse = await listAdminHomepageQuotes();
      setQuotes(quoteResponse?.items || []);
    } catch (error) {
      message.error(error.message || "Failed to load homepage data");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addSingle = async (values) => {
    setSaving(true);
    try { const response = await addAdminHomepageQuote(values); setQuotes(response.items || []); form.resetFields(); message.success("Quote added"); }
    catch (error) { message.error(error.message || "Failed to add quote"); }
    finally { setSaving(false); }
  };

  const updateActive = useCallback(async (id, active) => {
    const next = quotes.map((item) => item.id === id ? { ...item, active } : item);
    setQuotes(next);
    try { await replaceAdminHomepageQuotes(next); } catch (error) { message.error(error.message || "Failed to update quote"); void load(); }
  }, [quotes, load]);

  const quoteColumns = useMemo(() => [
    { title: "Quote", dataIndex: "text", key: "text", render: (value) => <span className="font-medium text-slate-700">{value}</span> },
    { title: "Author", dataIndex: "author", key: "author" },
    { title: "Homepage", dataIndex: "active", key: "active", width: 130, render: (active, item) => <Switch checked={active} onChange={(value) => updateActive(item.id, value)} /> },
  ], [updateActive]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-800">Quotes</h1><p className="text-sm text-slate-500">Manage the quote rotation shown in the app.</p></div><Button icon={<FiRefreshCw />} onClick={() => void load()} loading={loading}>Refresh</Button></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SummaryCard label="Quote Library" value={quotes.length} note="All homepage quote records currently stored in the backend." />
      <SummaryCard label="Homepage Active" value={quotes.filter((item) => item.active).length} note="Quotes currently enabled for rotation in the app." />
      <SummaryCard label="Unique Authors" value={new Set(quotes.map((item) => (item.author || "").trim()).filter(Boolean)).size} note="Distinct author names in the current quote library." />
    </div>
    <Tabs items={[{
      key: "quotes", label: "Homepage quotes", children: <Row gutter={[20, 20]}>
        <Col xs={24} lg={9}><Card title="Add one quote" bordered={false} className="shadow-sm"><Form form={form} layout="vertical" onFinish={addSingle} initialValues={{ active: true }}><Form.Item name="text" label="Quote" rules={[{ required: true, message: "Enter a quote" }]}><Input.TextArea rows={4} placeholder="Your only limit is your mind." /></Form.Item><Form.Item name="author" label="Author" rules={[{ required: true, message: "Enter an author" }]}><Input placeholder="Michael Phelps" /></Form.Item><Form.Item name="active" label="Show on homepage" valuePropName="checked"><Switch /></Form.Item><Button type="primary" htmlType="submit" icon={<FiSave />} loading={saving}>Add quote</Button></Form></Card></Col>
        <Col xs={24} lg={15}><Card title={`Quote library (${quotes.length})`} bordered={false} className="shadow-sm"><Table rowKey="id" loading={loading} columns={quoteColumns} dataSource={quotes} pagination={{ pageSize: 8 }} scroll={{ x: 600 }} locale={{ emptyText: "No homepage quotes have been added yet." }} /></Card></Col>
      </Row>
    }]} />
  </div>;
}
