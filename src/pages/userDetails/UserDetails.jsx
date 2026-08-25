import { ConfigProvider, Modal, Table, message } from "antd";
import { useEffect, useState } from "react";
import { IoSearch, IoChevronBack } from "react-icons/io5";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaRegEye } from "react-icons/fa";
import { AiOutlineDelete } from "react-icons/ai";
import TotalUsers from "../../components/dashboard/charts/TotalUsersChart";
import { deleteAdminUser, getAdminUser, getTrialCohorts, getTrialDropouts, getUserManagementOverview } from "../../../services/admin-users.service";
import DetailModal from "../../components/dashboard/DetailModal";
import {
  addBillingCycleToDate,
  formatBooleanLabel,
  formatDisplayDate,
  formatDisplayDateTime,
  formatEnumLabel,
  getStatusBadgeClassName,
} from "../../utils/dashboardFormatters";

function UserTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg animate-pulse">
      <div className="grid grid-cols-6 gap-4 bg-blue-600 px-6 py-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-4 rounded bg-blue-400/70" />
        ))}
      </div>
      <div className="space-y-4 px-6 py-5">
        {[...Array(8)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 items-center gap-4">
            <div className="h-4 w-8 rounded bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="h-4 w-28 rounded bg-slate-100" />
            </div>
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="h-4 w-36 rounded bg-slate-100" />
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="justify-self-end h-4 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_SUMMARY = {
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  userChart: [],
};

const getSubscriptionExpiryLabel = (user) => {
  const directValue =
    user.subscription_expires_at ||
    user.subscription?.expires_at ||
    user.expires_at ||
    "";

  if (directValue) {
    return formatDisplayDateTime(directValue);
  }

  const referenceDate =
    user.subscription_confirmed_at ||
    user.subscription?.confirmed_at ||
    user.subscription_started_at ||
    user.subscription?.started_at;
  const billingCycle =
    user.subscription_billing_cycle || user.subscription?.billing_cycle;
  const estimatedExpiry = addBillingCycleToDate(referenceDate, billingCycle);

  return estimatedExpiry ? formatDisplayDateTime(estimatedExpiry) : "N/A";
};

const isPhaseOneBetaUser = (user) =>
  String(user?.subscription_purchase_source || user?.subscription?.purchase_source || "").trim().toLowerCase() === "beta_trial"
  || Boolean(user?.is_beta_tester);

const getUserDetailCards = (user) => {
  const subscriptionAccess = Array.isArray(user.subscription_access)
    ? user.subscription_access
    : Array.isArray(user.subscription?.access)
      ? user.subscription.access
      : [];

  const cards = [
    { label: "Email", value: user.email || "N/A" },
    { label: "Phone No", value: user.contactNumber || user.phone_number || "N/A" },
    { label: "Joined Date", value: formatDisplayDate(user.createdAt) },
    { label: "Last Updated", value: formatDisplayDateTime(user.updatedAt) },
    { label: "Country", value: user.country || "N/A" },
    { label: "Role", value: formatEnumLabel(user.role) },
    { label: "Verified", value: formatBooleanLabel(user.isVerified ?? user.is_verified) },
    { label: "Account Status", value: formatEnumLabel(user.status) },
    { label: "Subscription Tier", value: formatEnumLabel(user.subscription_tier || user.subscriptionTier || user.subscription?.tier) },
    { label: "Subscription Role", value: formatEnumLabel(user.subscription_role || user.subscription?.role) },
    { label: "Subscription Status", value: formatEnumLabel(user.subscription_status || user.subscription?.status) },
    { label: "Billing Cycle", value: formatEnumLabel(user.subscription_billing_cycle || user.subscription?.billing_cycle) },
    { label: "Payment Confirmed", value: formatBooleanLabel(user.subscription_is_purchased ?? user.subscription?.is_purchased) },
    { label: "Purchase Source", value: formatEnumLabel(user.subscription_purchase_source || user.subscription?.purchase_source) },
    { label: "Subscription Started", value: formatDisplayDateTime(user.subscription_started_at || user.subscription?.started_at) },
    { label: "Subscription Confirmed", value: formatDisplayDateTime(user.subscription_confirmed_at || user.subscription?.confirmed_at) },
    { label: "Subscription Expires", value: getSubscriptionExpiryLabel(user) },
    { label: "Feature Access", value: subscriptionAccess.length > 0 ? subscriptionAccess.map(formatEnumLabel).join(", ") : "N/A", fullWidth: true },
  ];

  if (isPhaseOneBetaUser(user)) {
    cards.push(
      { label: "Phase 1 Beta Tester", value: "Yes" },
      { label: "Beta Access Tier", value: "Gold" },
      { label: "Beta Duration", value: "21 Days" },
      { label: "Beta Price", value: "€0" },
      { label: "Beta Payment Required", value: "No" },
      { label: "Beta Status", value: formatEnumLabel(user.trial_status || user.subscription_status || user.status) },
      { label: "Beta Start Date", value: formatDisplayDateTime(user.trial_start_at) },
      { label: "Beta End Date", value: formatDisplayDateTime(user.trial_end_at) },
      { label: "Beta Days Remaining", value: String(user.trial_days_remaining ?? 0) },
    );
  }

  return cards;
};

const getUserDetailSections = (user) => {
  const cards = getUserDetailCards(user);

  return [
    {
      key: "account",
      eyebrow: "Account Overview",
      title: "Identity and account state",
      cards: cards.filter((card) =>
        [
          "Email",
          "Phone No",
          "Country",
          "Role",
          "Verified",
          "Account Status",
          "Joined Date",
          "Last Updated",
        ].includes(card.label),
      ),
    },
    {
      key: "subscription",
      eyebrow: "Subscription Details",
      title: "Membership, billing, and access",
      cards: cards.filter((card) =>
        [
          "Subscription Tier",
          "Subscription Role",
          "Subscription Status",
          "Billing Cycle",
          "Payment Confirmed",
          "Purchase Source",
          "Subscription Started",
          "Subscription Confirmed",
          "Subscription Expires",
          "Feature Access",
        ].includes(card.label),
      ),
    },
    ...(isPhaseOneBetaUser(user)
      ? [{
        key: "beta",
        eyebrow: "Phase 1 Beta",
        title: "21-day Gold beta entitlement",
        cards: cards.filter((card) =>
          [
            "Phase 1 Beta Tester",
            "Beta Access Tier",
            "Beta Duration",
            "Beta Price",
            "Beta Payment Required",
            "Beta Status",
            "Beta Start Date",
            "Beta End Date",
            "Beta Days Remaining",
          ].includes(card.label),
        ),
      }]
      : []),
  ];
};

function UserDetails() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedUserId = searchParams.get("userId");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersData, setUsersData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [trialCohorts, setTrialCohorts] = useState([]);
  const [trialDropouts, setTrialDropouts] = useState([]);
  const [trialCohortError, setTrialCohortError] = useState("");
  const [trialDropoutError, setTrialDropoutError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [error, setError] = useState("");

  const pageSize = 10;

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadUserManagement = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [dataResult, cohortResult, dropoutResult] = await Promise.allSettled([
          getUserManagementOverview({ page: currentPage, limit: pageSize, query: searchQuery, signal: controller.signal }),
          getTrialCohorts({ signal: controller.signal }),
          getTrialDropouts({ signal: controller.signal }),
        ]);

        if (!isMounted) {
          return;
        }

        if (dataResult.status !== "fulfilled") {
          throw dataResult.reason;
        }

        const data = dataResult.value;
        setSummary(data.summary || DEFAULT_SUMMARY);
        setUsersData(data.table?.users || []);
        setTotalUsers(data.table?.total || 0);
        if (cohortResult.status === "fulfilled") {
          setTrialCohorts(cohortResult.value?.cohorts || []);
          setTrialCohortError("");
        } else {
          setTrialCohorts([]);
          setTrialCohortError(cohortResult.reason instanceof Error ? cohortResult.reason.message : "Failed to load trial cohorts");
        }
        if (dropoutResult.status === "fulfilled") {
          setTrialDropouts(dropoutResult.value?.users || []);
          setTrialDropoutError("");
        } else {
          setTrialDropouts([]);
          setTrialDropoutError(dropoutResult.reason instanceof Error ? dropoutResult.reason.message : "Failed to load trial dropouts");
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const detail = requestError instanceof Error ? requestError.message : "Failed to load user management data";
        setError(detail);
        setSummary(DEFAULT_SUMMARY);
        setUsersData([]);
        setTotalUsers(0);
        setTrialCohorts([]);
        setTrialDropouts([]);
        setTrialCohortError("");
        setTrialDropoutError("");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUserManagement();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentPage, searchQuery]);

  const reloadUserManagement = async (page = currentPage) => {
    const data = await getUserManagementOverview({
      page,
      limit: pageSize,
      query: searchQuery,
    });

    setSummary(data.summary || DEFAULT_SUMMARY);
    setUsersData(data.table?.users || []);
    setTotalUsers(data.table?.total || 0);

    return data;
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const showViewModal = async (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setIsViewLoading(true);

    try {
      const detail = await getAdminUser(user.id);
      setSelectedUser(detail);
    } catch (requestError) {
      message.error(requestError instanceof Error ? requestError.message : "Failed to load user details");
    } finally {
      setIsViewLoading(false);
    }
  };

  useEffect(() => {
    if (!requestedUserId) return;
    let cancelled = false;
    setSelectedUser({ id: requestedUserId, fullName: "Loading user..." });
    setIsViewModalOpen(true);
    setIsViewLoading(true);
    getAdminUser(requestedUserId)
      .then((user) => {
        if (!cancelled) setSelectedUser(user);
      })
      .catch((requestError) => {
        if (!cancelled) {
          message.error(requestError instanceof Error ? requestError.message : "Failed to load user details");
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsViewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestedUserId]);

  const handleViewCancel = () => {
    setIsViewModalOpen(false);
    setSelectedUser(null);
    if (requestedUserId) {
      const next = new URLSearchParams(searchParams);
      next.delete("userId");
      setSearchParams(next, { replace: true });
    }
  };

  const openDelete = (row) => {
    setSelectedUser(row);
    setIsDeleteModalOpen(true);
  };

  const handleCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const confirmDelete = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAdminUser(selectedUser.id);
      message.success("User deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);

      const data = await reloadUserManagement(currentPage);
      if ((data.table?.users || []).length === 0 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      }
    } catch (requestError) {
      message.error(requestError instanceof Error ? requestError.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      title: "No",
      key: "no",
      width: 70,
      render: (_, _record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <img
            src={record.profileImage || "/userimg.png"}
            className="h-10 w-10 rounded-full object-cover"
            alt="User Avatar"
            onError={(event) => {
              event.currentTarget.src = "/userimg.png";
            }}
          />
          <span className="leading-none">{value}</span>
        </div>
      ),
    },
    { title: "Role", dataIndex: "role", key: "role" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone No", dataIndex: "contactNumber", key: "contactNumber" },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleDateString() : "N/A"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          <button onClick={() => showViewModal(record)}>
            <FaRegEye className="h-5 w-5 cursor-pointer rounded-md text-blue-600" />
          </button>
          <button onClick={() => openDelete(record)}>
            <AiOutlineDelete className="h-5 w-5 cursor-pointer rounded-md text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const detailSections = selectedUser ? getUserDetailSections(selectedUser) : [];
  const hasSearch = Boolean(searchQuery.trim());
  const subscriptionTierLabel = selectedUser
    ? formatEnumLabel(
        selectedUser.subscription_tier ||
          selectedUser.subscriptionTier ||
          selectedUser.subscription?.tier,
      )
    : "N/A";
  const headerStatus = selectedUser
    ? String(selectedUser.subscription_status || selectedUser.status || "").toUpperCase()
    : "";
  const joinedLabel = selectedUser ? formatDisplayDate(selectedUser.createdAt) : "N/A";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 shadow-lg md:px-6 md:py-5">
        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-2 text-white transition-all duration-200 hover:bg-white/20"
            aria-label="Go back"
          >
            <IoChevronBack className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">User Management</h1>
            <p className="mt-1 text-sm text-white/80">Manage all non-admin users from the backend.</p>
          </div>

          <div className="ml-auto hidden gap-3 md:flex">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search users..."
                className="w-64 rounded-xl bg-white/90 py-2.5 pl-10 pr-4 text-slate-800 backdrop-blur-sm transition-all placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <IoSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="relative mt-3 w-full md:hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl bg-white/90 py-2.5 pl-10 pr-4 text-slate-800 backdrop-blur-sm transition-all placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <IoSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{summary.totalUsers}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">{hasSearch ? "Matching users" : "Shown on page"}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{hasSearch ? totalUsers : usersData.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Search</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {searchQuery.trim() || "All users"}
          </div>
        </div>
      </div>

      <TotalUsers summary={summary} isLoading={isLoading} error={error} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Trial cohorts</h2>
              <p className="text-sm text-slate-500">5-day Gold commercial trial conversion and day-by-day engagement by signup month and source. Phase 1 beta users are excluded.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            {trialCohortError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {trialCohortError}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Cohort</th><th>Source</th><th>Users</th><th>Converted</th><th>Rate</th></tr></thead>
                <tbody>{trialCohorts.length ? trialCohorts.map((cohort) => <tr key={`${cohort.cohort}-${cohort.signupSource}`} className="border-t border-slate-100"><td className="py-2 font-medium">{cohort.cohort}</td><td>{cohort.signupSource}</td><td>{cohort.totalUsers}</td><td>{cohort.convertedUsers}</td><td>{cohort.conversionRate}%</td></tr>) : <tr><td colSpan="5" className="py-6 text-center text-slate-400">No trial cohort data yet.</td></tr>}</tbody>
              </table>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="mb-4"><h2 className="text-lg font-bold text-slate-900">Dropout list</h2><p className="text-sm text-slate-600">Consented 5-day Gold trial users who reached day 5 without converting. Phase 1 beta users are excluded.</p></div>
          {trialDropoutError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {trialDropoutError}
            </div>
          ) : (
            <div className="space-y-3">{trialDropouts.length ? trialDropouts.slice(0, 8).map((dropout) => <div key={dropout.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><div><div className="font-semibold text-slate-900">{dropout.fullName}</div><div className="text-xs text-slate-500">{dropout.email} · {dropout.signupSource}</div></div><div className="text-right text-xs text-slate-500"><div>{dropout.coachMessages} coach messages</div><div>{dropout.nutritionPlanCreated ? "Nutrition plan created" : "No nutrition plan"}</div></div></div>) : <div className="py-6 text-center text-slate-500">No consented dropouts found.</div>}</div>
          )}
        </section>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : isLoading ? (
        <UserTableSkeleton />
      ) : (
        <ConfigProvider
          theme={{
            components: {
              Pagination: {
                colorPrimary: "#2563eb",
                colorPrimaryHover: "#1d4ed8",
              },
              Table: {
                headerBg: "#60a5fa",
                headerColor: "#ffffff",
                cellFontSize: 14,
                headerSplitColor: "transparent",
                borderColor: "#e5e7eb",
              },
            },
          }}
        >
          <Table
            dataSource={usersData}
            columns={columns}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize,
              total: totalUsers,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
            }}
            scroll={{ x: "max-content" }}
            className="custom-user-table"
          />
        </ConfigProvider>
      )}

      <Modal
        open={isDeleteModalOpen}
        centered
        onCancel={handleCancel}
        footer={null}
        className="delete-user-modal"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AiOutlineDelete className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-3 text-center text-2xl font-bold text-slate-800 md:text-3xl">Delete User</h1>
          <p className="mb-6 px-4 text-center text-base text-slate-600 md:text-lg">
            {selectedUser
              ? `Are you sure you want to delete ${selectedUser.fullName}?`
              : "Are you sure you want to delete this user?"}
          </p>
          <div className="flex w-full justify-center gap-3 px-4">
            <button
              onClick={handleCancel}
              className="max-w-[150px] flex-1 rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-800 transition-all duration-200 hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="max-w-[150px] flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {selectedUser ? (
        <DetailModal
          open={isViewModalOpen}
          onCancel={handleViewCancel}
          avatarSrc={selectedUser.profileImage || "/userimg.png"}
          avatarAlt={selectedUser.fullName}
          title={isViewLoading ? "Loading user..." : selectedUser.fullName}
          description={isPhaseOneBetaUser(selectedUser)
            ? "Review the Phase 1 beta tester profile, 21-day Gold entitlement, and membership access in one place."
            : "Review the account profile, subscription details, and membership access in one place."}
          badges={[
            { value: formatEnumLabel(selectedUser.role) },
            { value: subscriptionTierLabel },
            ...(isPhaseOneBetaUser(selectedUser) ? [{ value: "Phase 1 Beta Tester", className: "rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800" }] : []),
            { value: joinedLabel, label: "Joined" },
            { value: formatEnumLabel(headerStatus), className: `rounded-full px-3 py-1.5 text-sm font-medium ${getStatusBadgeClassName(headerStatus)}` },
          ]}
          sections={detailSections}
          isLoading={isViewLoading}
        />
      ) : null}
    </div>
  );
}

export default UserDetails;
