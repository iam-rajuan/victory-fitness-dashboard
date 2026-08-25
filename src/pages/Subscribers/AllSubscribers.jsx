import { ConfigProvider, Modal, Table, Spin, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { IoSearch, IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { FaRegEye } from "react-icons/fa";
import { AiOutlineDelete } from "react-icons/ai";
import DetailModal from "../../components/dashboard/DetailModal";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatEnumLabel,
  getStatusBadgeClassName,
} from "../../utils/dashboardFormatters";
import { listAdminSubscribers } from "../../../services/admin-content.service";
import { deleteAdminUser } from "../../../services/admin-users.service";

const getSubscriberDetailSections = (user) => [
  {
    key: "account",
    eyebrow: "Account Overview",
    title: "Identity and subscriber state",
    cards: [
      { label: "Email", value: user.email || "N/A" },
      { label: "Phone No", value: user.contactNumber || "N/A" },
      { label: "Country", value: user.country || "N/A" },
      { label: "Joined Date", value: formatDisplayDate(user.joinedDate) },
    ],
  },
  {
    key: "subscription",
    eyebrow: "Subscription Details",
    title: "Membership and access summary",
    cards: [
      { label: "Subscription Tier", value: formatEnumLabel(user.subscriptionTier) },
      { label: "Subscription Status", value: formatEnumLabel(user.status) },
      { label: "Member Since", value: formatDisplayDateTime(user.joinedDate) },
      {
        label: "Plan Summary",
        value: user.subscriptionTier
          ? `${formatEnumLabel(user.subscriptionTier)} membership is currently ${formatEnumLabel(user.status)}.`
          : "N/A",
        fullWidth: true,
      },
    ],
  },
];


function AllSubscribers() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSubscribers = async () => {
      setIsLoading(true);
      try {
        const response = await listAdminSubscribers({ limit: 250 });
        if (isMounted) {
          setUsersData(Array.isArray(response?.users) ? response.users : []);
        }
      } catch (err) {
        console.error("Failed to load subscribers:", err);
        if (isMounted) {
          message.error(err.message || "Failed to load subscribers");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubscribers();
    return () => {
      isMounted = false;
    };
  }, []);


  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const showViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
  };

  const openDelete = (row) => {
    setSelectedUser(row);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteAdminUser(selectedUser.id);
      setUsersData((prev) => prev.filter((user) => user.id !== selectedUser.id));
      message.success("Subscriber deleted successfully");
      setIsModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to delete subscriber:", err);
      message.error(err.message || "Failed to delete subscriber");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _r, index) => (currentPage - 1) * 10 + index + 1,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <img
            src={record.profileImage || "/userimg.png"}
            className="w-10 h-10 object-cover rounded-full"
            alt="User Avatar"
            onError={(event) => {
              event.currentTarget.src = "/userimg.png";
            }}
          />
          <span className="leading-none">{value}</span>
        </div>
      ),
    },
    { title: "Tier", dataIndex: "subscriptionTier", key: "subscriptionTier", render: (value) => formatEnumLabel(value) },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone No", dataIndex: "contactNumber", key: "contactNumber" },
    {
      title: "Joined Date",
      dataIndex: "joinedDate",
      key: "joinedDate",
      render: (value) => value ? new Date(value).toLocaleDateString() : "N/A",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <button onClick={() => showViewModal(record)}>
            <FaRegEye className="text-blue-600 w-5 h-5 cursor-pointer rounded-md" />
          </button>
          <button onClick={() => openDelete(record)}>
            <AiOutlineDelete className="h-5 w-5 text-red-600 cursor-pointer rounded-md" />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return usersData;
    return usersData.filter((r) =>
      [r.fullName, r.email, r.contactNumber, r.subscriptionTier, r.country]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [usersData, searchQuery]);

  const meta = { total: filteredData.length };
  const detailSections = selectedUser ? getSubscriberDetailSections(selectedUser) : [];
  const joinedLabel = selectedUser ? formatDisplayDate(selectedUser.joinedDate) : "N/A";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 md:px-6 py-4 md:py-5 rounded-2xl mb-5 shadow-lg">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
            aria-label="Go back"
          >
            <IoChevronBack className="w-6 h-6" />
          </button>
          <h1 className="text-white text-2xl sm:text-3xl font-bold">All Subscribers</h1>

          {/* Desktop Search */}
          <div className="hidden md:flex ml-auto gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subscribers..."
                className="bg-white/90 backdrop-blur-sm text-slate-800 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all w-64"
              />
              <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative w-full md:hidden mt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscribers..."
            className="w-full bg-white/90 backdrop-blur-sm text-slate-800 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          />
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        </div>
      </div>

      <ConfigProvider
        theme={{
          components: {
            Pagination: {
              colorPrimary: "#2563eb",
              colorPrimaryHover: "#1d4ed8",
            },
            Table: {
              headerBg: '#60a5fa',
              headerColor: '#ffffff',
              cellFontSize: 14,
              headerSplitColor: 'transparent',
              borderColor: '#e5e7eb',
            },
          },
        }}
      >
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: meta.total || 0,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: "max-content" }}
          className="custom-user-table"
        />

        {/* Delete Modal */}
        <Modal
          open={isModalOpen}
          centered
          onCancel={handleCancel}
          footer={null}
          className="delete-user-modal"
        >
          <div className="flex flex-col justify-center items-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AiOutlineDelete className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-3">Delete Subscriber</h1>
            <p className="text-base md:text-lg text-center text-slate-600 mb-6 px-4">
              {selectedUser
                ? `Are you sure you want to delete ${selectedUser.fullName}?`
                : `Are you sure you want to delete this subscriber?`}
            </p>
            <div className="flex justify-center gap-3 w-full px-4">
              <button
                onClick={handleCancel}
                className="flex-1 max-w-[150px] bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 max-w-[150px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>

        {/* View Modal */}
        {selectedUser ? (
          <DetailModal
            open={isViewModalOpen}
            onCancel={handleViewCancel}
            avatarSrc={selectedUser.profileImage || "/userimg.png"}
            avatarAlt={selectedUser.fullName}
            title={selectedUser.fullName}
            description="Review subscriber profile, plan status, and membership summary in the same dashboard style."
            badges={[
              { value: "Subscriber" },
              { value: formatEnumLabel(selectedUser.subscriptionTier) },
              { value: joinedLabel, label: "Joined" },
              { value: formatEnumLabel(selectedUser.status), className: `rounded-full px-3 py-1.5 text-sm font-medium ${getStatusBadgeClassName(selectedUser.status)}` },
            ]}
            sections={detailSections}
          />
        ) : null}
      </ConfigProvider>
    </div>
  );
}

export default AllSubscribers;
