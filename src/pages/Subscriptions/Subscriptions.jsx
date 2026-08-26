import { useEffect, useState, useMemo } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message, Popconfirm, InputNumber, DatePicker, Checkbox, Spin } from 'antd';
import { FiEdit, FiTrash2, FiPlus, FiCheck, FiX, FiCreditCard, FiSliders, FiList, FiLayers } from 'react-icons/fi';
import { FaMedal, FaRegCircle } from 'react-icons/fa';
import { IoDiamond } from 'react-icons/io5';
import dayjs from 'dayjs';
import {
  createAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  listAdminSubscriptionFeatures,
  listAdminSubscriptionPlans,
  updateAdminSubscriptionPlan,
} from '../../../services/admin-content.service';
const formatEuroPrice = (price) => {
  if (price == null) {
    return null;
  }
  return `EUR ${price}`;
};
const normalizeFeatureAccess = (items) =>
  Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean)));
const FALLBACK_FEATURE_CATALOG = [
  {
    key: 'home',
    label: 'Home Dashboard',
    description: 'Main home feed, highlights, and entry overview cards.',
    category: 'Core Access',
    defaultTiers: ['SILVER', 'GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/'],
  },
  {
    key: 'workout',
    label: 'Workout Library',
    description: 'Workout browsing, workout detail screens, and published training videos.',
    category: 'Core Access',
    defaultTiers: ['SILVER', 'GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/workout', '/workout-library'],
  },
  {
    key: 'challenge',
    label: 'Challenges',
    description: 'Challenge catalog, joining challenges, progress tracking, and day completion.',
    category: 'Core Access',
    defaultTiers: ['SILVER', 'GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/challenge', '/challenges'],
  },
  {
    key: 'community',
    label: 'Community Feed',
    description: 'Community posts, challenge chat, reactions, comments, and accountability feed.',
    category: 'Core Access',
    defaultTiers: ['SILVER', 'GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/community', '/challenge', '/challenges'],
  },
  {
    key: 'profile',
    label: 'Profile',
    description: 'Profile screen, rank, settings, and subscription summary access.',
    category: 'Core Access',
    defaultTiers: ['SILVER', 'GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/profile'],
  },
  {
    key: 'mealPlan',
    label: 'Meal Plan',
    description: 'Nutrition plan generation, meal plan dashboard, and guided nutrition onboarding flows.',
    category: 'Nutrition',
    defaultTiers: ['GOLD', 'PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/mealPlan'],
  },
  {
    key: 'nutrition_tracker',
    label: 'Nutrition Tracker',
    description: 'Meal logging, daily nutrition tracking, and tracker-specific insights.',
    category: 'Nutrition',
    defaultTiers: ['PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/mealPlan'],
  },
  {
    key: 'meal_analysis',
    label: 'AI Meal Analysis',
    description: 'AI meal image and document analysis with saved history.',
    category: 'Nutrition',
    defaultTiers: ['PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/mealPlan'],
  },
  {
    key: 'workoutplan',
    label: 'Workout Plan AI',
    description: 'Personalized multi-day workout plan generation and adaptive progress.',
    category: 'Advanced Coaching',
    defaultTiers: ['PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/workoutplan'],
  },
  {
    key: 'longevity',
    label: 'Longevity OS',
    description: 'Longevity dashboard, wearable data, habits, recovery, and health insights.',
    category: 'Advanced Coaching',
    defaultTiers: ['PLATINUM', 'INNER_CIRCLE'],
    routeHints: ['/profile/longevity-os'],
  },
  {
    key: 'application',
    label: 'Coaching Application',
    description: 'Application form access for premium/direct coaching programmes.',
    category: 'Premium Coaching',
    defaultTiers: ['INNER_CIRCLE'],
    routeHints: ['/profile/application'],
  },
  {
    key: 'coach_victor',
    label: 'Coach Victor',
    description: 'AI Coach Victor chat, conversation history, and direct coaching entry points.',
    category: 'Premium Coaching',
    defaultTiers: ['INNER_CIRCLE'],
    routeHints: ['/chat'],
  },
  {
    key: 'longevity_plan',
    label: 'Longevity Plan AI',
    description: 'AI-generated weekly longevity plans and recommendation plans.',
    category: 'Premium Coaching',
    defaultTiers: ['INNER_CIRCLE'],
    routeHints: ['/profile/longevity-os'],
  },
];
const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [featureCatalog, setFeatureCatalog] = useState(FALLBACK_FEATURE_CATALOG);
  const [isYearly, setIsYearly] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [form] = Form.useForm();
  const featureLabelMap = useMemo(
    () =>
      featureCatalog.reduce((accumulator, item) => {
        accumulator[item.key] = item.label;
        return accumulator;
      }, {}),
    [featureCatalog],
  );
  const groupedFeatureCatalog = useMemo(() => {
    const groups = featureCatalog.reduce((accumulator, item) => {
      const category = item.category || 'Other';
      if (!accumulator[category]) {
        accumulator[category] = [];
      }
      accumulator[category].push(item);
      return accumulator;
    }, {});
    return Object.entries(groups);
  }, [featureCatalog]);
  const sortedPlans = useMemo(() => {
    const getPlanOrderWeight = (tier) => {
      const t = String(tier || '').toUpperCase();
      if (t === 'GOLD') return 1;
      if (t === 'SILVER') return 2;
      if (t.includes('BETA') || t.includes('TRIAL')) return 3;
      if (t === 'PLATINUM') return 4;
      if (t === 'INNER_CIRCLE') return 5;
      return 10;
    };
    return [...plans].sort((a, b) => getPlanOrderWeight(a.tier) - getPlanOrderWeight(b.tier));
  }, [plans]);
  useEffect(() => {
    let isMounted = true;
    const loadPlans = async () => {
      try {
        const [plansResponse, featuresResponse] = await Promise.all([
          listAdminSubscriptionPlans(),
          listAdminSubscriptionFeatures(),
        ]);
        if (isMounted) {
          setPlans(Array.isArray(plansResponse?.items) ? plansResponse.items : []);
          const catalogItems = Array.isArray(featuresResponse?.items) && featuresResponse.items.length > 0
            ? featuresResponse.items
            : FALLBACK_FEATURE_CATALOG;
          setFeatureCatalog(catalogItems);
          setLoadingCatalog(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoadingCatalog(false);
        }
        message.error(error.message || 'Failed to load subscription plans');
      }
    };
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);
  const isDiscountActive = (plan) => {
    if (!plan?.discountPercentage) {
      return false;
    }
    const now = dayjs();
    const start = plan.discountStartDate ? dayjs(plan.discountStartDate) : null;
    const end = plan.discountEndDate ? dayjs(plan.discountEndDate) : null;
    if (start && now.isBefore(start)) {
      return false;
    }
    if (end && now.isAfter(end)) {
      return false;
    }
    return true;
  };
  const getDiscountedPrice = (price, discountPercentage, active) => {
    if (price == null) {
      return null;
    }
    if (!active || !discountPercentage) {
      return price;
    }
    return Math.max(Math.round(price * (100 - discountPercentage) / 100), 0);
  };
  const getPlanPricingDetails = (plan, yearly) => {
    const originalPrice = yearly ? plan.priceYearly : plan.priceMonthly;
    const discountActive = isDiscountActive(plan);
    const discountedPrice = getDiscountedPrice(originalPrice, plan.discountPercentage, discountActive);
    const hasDiscount = (
      !plan.isApplicationOnly &&
      discountActive &&
      originalPrice != null &&
      discountedPrice != null &&
      discountedPrice !== originalPrice
    );
    return {
      discountActive,
      originalPrice,
      discountedPrice,
      hasDiscount,
      cycleLabel: yearly ? 'year' : 'month',
    };
  };
  const handleAdd = () => {
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({
      features: [''],
      featureAccess: ['home', 'workout', 'challenge', 'community', 'profile'],
      isApplicationOnly: false,
      isMostPopular: false,
      discountPercentage: null,
      discountStartDate: null,
      discountEndDate: null,
    });
    setIsModalVisible(true);
  };
  const handleEdit = (plan) => {
    setEditingPlan(plan);
    form.setFieldsValue({
      ...plan,
      discountStartDate: plan.discountStartDate ? dayjs(plan.discountStartDate) : null,
      discountEndDate: plan.discountEndDate ? dayjs(plan.discountEndDate) : null,
    });
    setIsModalVisible(true);
  };
  const handleDelete = async (id) => {
    try {
      await deleteAdminSubscriptionPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      message.success('Plan deleted successfully');
    } catch (error) {
      message.error(error.message || 'Failed to delete plan');
    }
  };
  const handleSubmit = async (values) => {
    try {
      const discountPercentage =
        values.discountPercentage == null || values.discountPercentage === ''
          ? null
          : Number(values.discountPercentage);
      const isApplicationOnly = Boolean(values.isApplicationOnly);
      const payload = {
        ...values,
        featureAccess: normalizeFeatureAccess(values.featureAccess),
        features: normalizeFeatureAccess(values.features),
        priceMonthly: isApplicationOnly ? null : values.priceMonthly,
        priceYearly: isApplicationOnly ? null : values.priceYearly,
        discountPercentage: isApplicationOnly ? null : discountPercentage,
        discountStartDate:
          !isApplicationOnly && discountPercentage != null && values.discountStartDate
            ? values.discountStartDate.toISOString()
            : null,
        discountEndDate:
          !isApplicationOnly && discountPercentage != null && values.discountEndDate
            ? values.discountEndDate.toISOString()
            : null,
      };
      if (editingPlan) {
        const updated = await updateAdminSubscriptionPlan(editingPlan.id, payload);
        setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)));
        message.success('Plan updated successfully');
      } else {
        const created = await createAdminSubscriptionPlan(payload);
        setPlans((prev) => [...prev, created]);
        message.success('Plan added successfully');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.message || 'Failed to save plan');
    }
  };
  const getIcon = (type) => {
    switch (type) {
      case 'silver_medal':
        return <span className="bg-[#b4b4bb] p-2 rounded-full inline-flex"><FaMedal size={20} className="text-white" /></span>;
      case 'gold_medal':
        return <span className="bg-[#fbbf24] p-2 rounded-full inline-flex"><FaMedal size={20} className="text-white" /></span>;
      case 'diamond':
        return <span className="text-[#38bdf8]"><IoDiamond size={32} /></span>;
      case 'circle':
        return <FaRegCircle strokeWidth={3} size={30} className="text-[#fb7185] mb-1" />;
      default:
        return <FaMedal size={24} className="text-slate-400" />;
    }
  };
  return (
    <div className="flex flex-col space-y-6 pt-2 pb-10 min-h-screen text-slate-100 font-sans tracking-wide">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Manage Subscriptions</h1>
        </div>
        {/*
        <div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md"
          >
            <FiPlus />
            Add New Plan
          </button>
        </div>
        */}
      </div>
      <div className="flex flex-col items-center justify-center text-center mt-6 mb-12">
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight mb-4">
          CHANGE YOUR <span className="text-[#00e5ff]">STRUCTURE</span>
        </h2>
        <p className="text-slate-500 text-sm md:text-base font-medium max-w-2xl mx-auto mb-10">
          No more guesswork. Only results. Choose the plan that fits your goal.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm font-semibold text-slate-400">
          <span className={!isYearly ? 'text-slate-800' : ''}>MONTHLY</span>
          <div
            onClick={() => setIsYearly(!isYearly)}
            className="w-14 h-7 bg-[#1e293b] rounded-full p-1 cursor-pointer flex items-center relative transition-colors duration-300"
          >
            <div className={`w-5 h-5 rounded-full bg-[#00e5ff] shadow-sm transform transition-transform duration-300 ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} />
          </div>
          <span className={isYearly ? 'text-slate-800' : ''}>YEARLY</span>
          <span className="bg-[#00e5ff] text-[#0f172a] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ml-2">Save up to 33%</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 w-full max-w-[1650px] mx-auto px-4">
        {sortedPlans.map((plan) => {
          const pricing = getPlanPricingDetails(plan, isYearly);
          return (
            <div
              key={plan.id}
              className={`group relative flex flex-col w-full p-6 rounded-2xl transition-all duration-300 ${
                plan.isMostPopular
                  ? 'bg-[#0b1322] border-2 border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.15)] shadow-[#00e5ff]/20'
                  : 'bg-[#0f172a] border border-[#1e293b]'
              }`}
            >
              {plan.isMostPopular ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00e5ff] text-[#0f172a] text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full z-10 whitespace-nowrap">
                  Most Popular
                </div>
              ) : null}
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={() => handleEdit(plan)}
                  className="bg-slate-800 hover:bg-blue-600 border border-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition-colors shadow-lg"
                  title="Edit Plan"
                >
                  <FiEdit size={14} />
                </button>
                <Popconfirm
                  title="Delete Plan"
                  description="Are you sure you want to delete this subscription plan?"
                  onConfirm={() => handleDelete(plan.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button
                    className="bg-slate-800 hover:bg-red-600 border border-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition-colors shadow-lg"
                    title="Delete Plan"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </Popconfirm>
              </div>
              <div className="mb-6 relative">
                {getIcon(plan.iconType, plan.isMostPopular)}
                {(plan.iconType === 'silver_medal' || plan.iconType === 'gold_medal') ? (
                  <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-[#1e293b] w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm border border-slate-800">
                    {plan.iconType === 'gold_medal' ? '1' : '2'}
                  </span>
                ) : null}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{plan.tier}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[40px] opacity-80">{plan.description}</p>
              <div className="mb-6">
                {plan.isApplicationOnly ? (
                  <div>
                    <h4 className="text-[28px] font-bold text-white leading-tight break-words">Application Only</h4>
                  </div>
                ) : pricing.hasDiscount ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Offer -{plan.discountPercentage}%
                      </span>
                      <span className="text-sm text-slate-500 line-through">
                        {formatEuroPrice(pricing.originalPrice)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] font-bold text-white">
                        {formatEuroPrice(pricing.discountedPrice)}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">per {pricing.cycleLabel}</span>
                    </div>
                    <p className="text-xs font-medium text-emerald-200/85">
                      You save {formatEuroPrice(pricing.originalPrice - pricing.discountedPrice)}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[32px] font-bold text-white">
                      {formatEuroPrice(pricing.originalPrice)}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">per {pricing.cycleLabel}</span>
                  </div>
                )}
                {!plan.isApplicationOnly && isYearly && plan.priceMonthly ? (
                  <p className="text-[10px] text-[#00e5ff] font-bold uppercase tracking-wider mt-2">Best Value</p>
                ) : null}
              </div>
              <div className="flex-1 flex flex-col gap-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 bg-[#00e5ff] rounded-full p-0.5 flex items-center justify-center">
                      <FiCheck size={10} className="text-[#0f172a] stroke-[4]" />
                    </div>
                    <span className="text-sm text-slate-300 font-medium leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mb-6 flex flex-wrap gap-2">
                {normalizeFeatureAccess(plan.featureAccess).slice(0, 4).map((feature) => (
                  <span key={feature} className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                    {featureLabelMap[feature] || feature}
                  </span>
                ))}
                {normalizeFeatureAccess(plan.featureAccess).length > 4 ? (
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    +{normalizeFeatureAccess(plan.featureAccess).length - 4}
                  </span>
                ) : null}
              </div>
              <button
                className={`w-full py-3 rounded-xl text-sm font-bold tracking-wider transition-all ${
                  plan.isMostPopular
                    ? 'bg-[#00e5ff] hover:bg-[#33ebfc] text-[#0f172a] shadow-lg shadow-[#00e5ff]/20'
                    : 'bg-white hover:bg-slate-100 text-[#0f172a]'
                }`}
              >
                {plan.isApplicationOnly ? 'APPLY NOW' : 'CHOOSE PLAN'}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-16 pt-8 border-t border-slate-200/60 max-w-7xl mx-auto w-full text-center">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
          Secure encryption. Cancel anytime. Payment simulation.
        </p>
      </div>
      <Modal
        title={
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiCreditCard size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingPlan ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Configure features, modules, and pricing tiers for the mobile app
              </p>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        closeIcon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <FiX size={18} className="text-slate-500" />
          </div>
        }
        footer={null}
        destroyOnClose
        className="workout-modal"
        width={720}
        styles={{
          header: {
            borderBottom: '1px solid #f1f5f9',
            paddingInline: 32,
            paddingBlock: 20,
            background: '#ffffff',
          },
          content: {
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            padding: 0,
          },
          body: {
            paddingInline: 32,
            paddingTop: 24,
            paddingBottom: 32,
            background: '#ffffff',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          className="mt-2 space-y-6"
        >
          {/* General Information Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <FiSliders size={12} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan General Settings</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                name="tier"
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    Tier Name <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Please input the tier name!' }]}
              >
                <Input 
                  placeholder="e.g. VICTORY BRONZE" 
                  className="rounded-xl border-slate-200 bg-white text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-blue-300 py-2.5" 
                />
              </Form.Item>
              <Form.Item
                name="iconType"
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    Display Icon <span className="text-red-500 font-bold">*</span>
                  </span>
                }
                rules={[{ required: true, message: 'Please select an icon!' }]}
              >
                <Select 
                  placeholder="Select icon" 
                  size="large"
                  className="w-full [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!border-slate-200 [&>.ant-select-selector]:!shadow-sm hover:[&>.ant-select-selector]:!border-blue-300"
                >
                  <Select.Option value="silver_medal">Silver Medal</Select.Option>
                  <Select.Option value="gold_medal">Gold Medal</Select.Option>
                  <Select.Option value="diamond">Diamond</Select.Option>
                  <Select.Option value="circle">Pink Circle</Select.Option>
                </Select>
              </Form.Item>
            </div>
            <Form.Item
              name="description"
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  Catchphrase Description <span className="text-red-500 font-bold">*</span>
                </span>
              }
              rules={[{ required: true, message: 'Please input description!' }]}
            >
              <Input.TextArea 
                placeholder="A short catchphrase for this plan..." 
                rows={2} 
                className="rounded-xl border-slate-200 bg-white text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-blue-300"
              />
            </Form.Item>
          </div>
          {/* Pricing Settings Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <FiCreditCard size={12} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pricing Settings</h4>
              </div>
              <Form.Item
                name="isApplicationOnly"
                valuePropName="checked"
                className="mb-0"
              >
                <Switch checkedChildren="Application Only" unCheckedChildren="Has Pricing" className="bg-slate-300" />
              </Form.Item>
            </div>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.isApplicationOnly !== currentValues.isApplicationOnly}
            >
              {({ getFieldValue }) =>
                !getFieldValue('isApplicationOnly') ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-slate-100 pt-4">
                    <Form.Item
                      name="priceMonthly"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Price (EUR) *</span>}
                      rules={[{ required: true, message: 'Monthly price is required!' }]}
                    >
                      <InputNumber 
                        min={0} 
                        className="w-full rounded-xl border-slate-200 shadow-sm [&>.ant-input-number-input]:!py-1.5 hover:border-blue-300" 
                        size="large" 
                      />
                    </Form.Item>
                    <Form.Item
                      name="priceYearly"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Yearly Price (EUR) *</span>}
                      rules={[{ required: true, message: 'Yearly price is required!' }]}
                    >
                      <InputNumber 
                        min={0} 
                        className="w-full rounded-xl border-slate-200 shadow-sm [&>.ant-input-number-input]:!py-1.5 hover:border-blue-300" 
                        size="large" 
                      />
                    </Form.Item>
                    <Form.Item
                      name="discountPercentage"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Percentage</span>}
                    >
                      <InputNumber 
                        min={0} 
                        max={100} 
                        className="w-full rounded-xl border-slate-200 shadow-sm [&>.ant-input-number-input]:!py-1.5 hover:border-blue-300" 
                        size="large" 
                        placeholder="e.g. 10" 
                      />
                    </Form.Item>
                    <Form.Item
                      name="discountStartDate"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount Start Date</span>}
                    >
                      <DatePicker 
                        showTime 
                        className="w-full rounded-xl border-slate-200 shadow-sm hover:border-blue-300 py-1.5" 
                        size="large" 
                      />
                    </Form.Item>
                    <Form.Item
                      name="discountEndDate"
                      label={<span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discount End Date</span>}
                      className="col-span-1 md:col-span-2"
                    >
                      <DatePicker 
                        showTime 
                        className="w-full rounded-xl border-slate-200 shadow-sm hover:border-blue-300 py-1.5" 
                        size="large" 
                      />
                    </Form.Item>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-4 text-center py-2 text-xs text-slate-400 font-semibold">
                    🔒 Application mode enabled. Users will see "Apply Now" button instead of direct checkout.
                  </div>
                )
              }
            </Form.Item>
          </div>
          {/* Plan Settings & Access Card */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 text-purple-600">
                  <FiSliders size={12} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Settings & Feature Access</h4>
              </div>
              <Form.Item
                name="isMostPopular"
                valuePropName="checked"
                className="mb-0"
              >
                <Switch checkedChildren="Featured Plan" unCheckedChildren="Standard Plan" className="bg-slate-300" />
              </Form.Item>
            </div>
            <Form.Item
              name="featureAccess"
              label={
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  Unlocks Real App Features <span className="text-red-500 font-bold">*</span>
                </span>
              }
              rules={[
                {
                  validator: (_, value) =>
                    Array.isArray(value) && value.length > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Select at least one real feature for this plan.')),
                },
              ]}
            >
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.featureAccess !== currentValues.featureAccess}
              >
                {({ getFieldValue }) => {
                  const selectedFeatures = getFieldValue('featureAccess') || [];
                  return (
                    <Checkbox.Group className="w-full">
                      <div className="space-y-4">
                        <div className="rounded-xl border border-amber-150 bg-amber-50/60 px-4 py-3 text-xs text-amber-800 leading-relaxed flex items-start gap-2.5">
                          <FiAlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Warning:</strong> These toggles control real entitlements in the mobile app and backend. Users on this plan will only unlock the features selected here.
                          </span>
                        </div>
                        {loadingCatalog ? (
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-5 text-slate-500">
                            <Spin size="small" />
                            <span>Loading real feature catalog…</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {groupedFeatureCatalog.map(([category, items]) => {
                              // Dynamic category icon chooser
                              const getCategoryIcon = (cat) => {
                                if (cat === 'Core Access') return <FiLayers size={12} />;
                                if (cat === 'Nutrition') return <FiActivity size={12} />;
                                if (cat === 'Advanced Coaching') return <FiCompass size={12} />;
                                if (cat === 'Premium Coaching') return <FiAward size={12} />;
                                return <FiGrid size={12} />;
                              };

                              return (
                                <div key={category} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                                      {getCategoryIcon(category)}
                                    </div>
                                    <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{category}</h5>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    {items.map((item) => {
                                      const isSelected = selectedFeatures.includes(item.key);
                                      return (
                                        <Checkbox 
                                          key={item.key} 
                                          value={item.key} 
                                          className="!m-0 w-full [&>.ant-checkbox]:mt-1.5 [&>.ant-checkbox+span]:w-full [&>.ant-checkbox+span]:pl-3 flex items-start"
                                        >
                                          <div className={`rounded-xl border p-4 transition-all w-full text-left ${
                                            isSelected 
                                              ? 'border-blue-200 bg-blue-50/20 shadow-sm' 
                                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                          }`}>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-sm font-bold text-slate-800">{item.label}</span>
                                              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                {item.key}
                                              </span>
                                            </div>
                                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{item.description}</p>
                                            
                                            {Array.isArray(item.routeHints) && item.routeHints.length > 0 ? (
                                              <p className="mt-2.5 text-[10px] font-bold text-cyan-600 tracking-wide uppercase">
                                                Route Hints: {item.routeHints.join(', ')}
                                              </p>
                                            ) : null}

                                            {Array.isArray(item.defaultTiers) && item.defaultTiers.length > 0 ? (
                                              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                                Default: {item.defaultTiers.join(', ')}
                                              </p>
                                            ) : null}
                                          </div>
                                        </Checkbox>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </Checkbox.Group>
                  );
                }}
              </Form.Item>
            </Form.Item>
          </div>
          {/* Features Checklist List */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
                <FiList size={12} />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-semibold">Features Checklist List</h4>
            </div>
            <Form.List name="features">
              {(fields, { add, remove }) => (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <Form.Item
                        {...field}
                        rules={[{ required: true, message: 'Feature cannot be empty!' }]}
                        className="mb-0 flex-1"
                      >
                        <Input 
                          placeholder={`Feature ${index + 1}`} 
                          className="rounded-xl border-slate-200 bg-white text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-blue-300 py-2.5" 
                        />
                      </Form.Item>
                      {fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<FiTrash2 />}
                          onClick={() => remove(field.name)}
                          className="flex-shrink-0 text-red-500 hover:text-red-600"
                        />
                      ) : null}
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<FiPlus />}
                    className="mt-2 h-10 rounded-xl border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 font-semibold text-xs"
                  >
                    Add Feature Item
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <Button 
              size="large" 
              onClick={() => setIsModalVisible(false)} 
              className="rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-semibold text-sm h-10 px-5"
            >
              Cancel
            </Button>
            <Button 
              size="large" 
              type="primary" 
              htmlType="submit" 
              className="bg-blue-600 hover:bg-blue-500 shadow-sm hover:shadow-md rounded-xl font-semibold text-sm h-10 px-6"
            >
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
export default Subscriptions;
