import { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Upload, message, Popconfirm, Button, Spin } from 'antd';
import { FiEdit, FiTrash2, FiPlus, FiImage, FiClock } from 'react-icons/fi';
import { FaComments, FaFire, FaUsers, FaTrophy } from 'react-icons/fa';
import { adminApiRequest } from '../../../services/auth.service';
import { toBase64Payload } from "../../utils/imageUpload";
const challengeStatusFilters = ['ALL', 'ACTIVE', 'UPCOMING', 'DRAFT', 'ARCHIVED'];
const challengeGoalTypeOptions = ['Strength', 'Cardio', 'Mindfulness', 'Nutrition', 'Family'];
const challengeInputClassName =
  'rounded-xl border-slate-200 bg-white text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500';
const PLAN_GENERATION_DEFAULTS = {
  title: 'Strength & Consistency Challenge',
  description: 'A guided challenge designed to build consistency, movement quality, recovery, and overall fitness with realistic daily actions.',
  category: 'Strength',
  durationDays: 7,
  points: 500,
  difficulty: 'INTERMEDIATE',
  status: 'ACTIVE',
};
const createId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const createEmptyExercise = () => ({
  id: createId('exercise'),
  name: '',
  details: '',
  notes: '',
  workout_id: '',
  workout_title: '',
  workout_vimeo_id: '',
  workout_video_url: '',
  workout_video_source: 'VIMEO',
  workout_thumbnail: '',
});
const createEmptySection = () => ({
  id: createId('section'),
  title: '',
  description: '',
  estimated_minutes: 15,
  exercises: [createEmptyExercise(), createEmptyExercise()],
});
const createEmptyDay = (dayNumber) => ({
  day_number: dayNumber,
  title: `Day ${dayNumber}`,
  focus: '',
  notes: '',
  sections: [createEmptySection(), createEmptySection()],
});
const normalizeWorkoutMatchValue = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const findMatchingWorkoutForExercise = (exerciseName, workouts = []) => {
  const normalizedExercise = normalizeWorkoutMatchValue(exerciseName);
  if (!normalizedExercise) {
    return null;
  }
  return workouts.find((workout) => {
    const normalizedTitle = normalizeWorkoutMatchValue(workout?.title);
    const normalizedTag = normalizeWorkoutMatchValue(workout?.tag);
    return (
      normalizedExercise === normalizedTitle ||
      normalizedExercise === normalizedTag ||
      normalizedTitle.includes(normalizedExercise) ||
      normalizedExercise.includes(normalizedTitle)
    );
  }) || null;
};
const autoAttachWorkoutMatches = (days = [], workouts = []) =>
  days.map((day) => ({
    ...day,
    sections: (day.sections || []).map((section) => ({
      ...section,
      exercises: (section.exercises || []).map((exercise) => {
        if (exercise?.workout_vimeo_id || exercise?.workout_id) {
          return exercise;
        }
        const matchedWorkout = findMatchingWorkoutForExercise(exercise?.name, workouts);
        if (!matchedWorkout) {
          return exercise;
        }
        return {
          ...exercise,
          workout_id: matchedWorkout.id,
          workout_title: matchedWorkout.title,
          workout_vimeo_id: matchedWorkout.vimeoId,
          workout_video_url: matchedWorkout.videoUrl || '',
          workout_video_source: matchedWorkout.videoSource || 'VIMEO',
          workout_thumbnail: matchedWorkout.thumbnail || '',
        };
      }),
    })),
  }));
const normalizePlanDays = (days = []) =>
  days.map((day, dayIndex) => ({
    day_number: Number(day?.day_number || dayIndex + 1),
    title: day?.title || `Day ${dayIndex + 1}`,
    focus: day?.focus || '',
    notes: day?.notes || '',
    sections: Array.isArray(day?.sections) && day.sections.length > 0
      ? day.sections.map((section, sectionIndex) => ({
          id: section?.id || createId(`section-${dayIndex + 1}-${sectionIndex + 1}`),
          title: section?.title || '',
          description: section?.description || '',
          estimated_minutes: Number(section?.estimated_minutes || 15),
          exercises: Array.isArray(section?.exercises) && section.exercises.length > 0
            ? section.exercises.map((exercise, exerciseIndex) => ({
                id: exercise?.id || createId(`exercise-${dayIndex + 1}-${sectionIndex + 1}-${exerciseIndex + 1}`),
                name: exercise?.name || '',
                details: exercise?.details || '',
                notes: exercise?.notes || '',
                workout_id: exercise?.workout_id || '',
                workout_title: exercise?.workout_title || '',
                workout_vimeo_id: exercise?.workout_vimeo_id || '',
                workout_video_url: exercise?.workout_video_url || '',
                workout_video_source: exercise?.workout_video_source || 'VIMEO',
                workout_thumbnail: exercise?.workout_thumbnail || '',
              }))
            : [createEmptyExercise()],
        }))
      : [createEmptySection()],
  }));
const sanitizePlanDaysForSubmit = (days = []) =>
  normalizePlanDays(days)
    .map((day, dayIndex) => {
      const sections = (day.sections || [])
        .map((section, sectionIndex) => {
          const exercises = (section.exercises || [])
            .filter((exercise) => String(exercise?.name || '').trim() || String(exercise?.details || '').trim() || String(exercise?.notes || '').trim())
            .map((exercise, exerciseIndex) => ({
              id: exercise.id || createId(`exercise-${dayIndex + 1}-${sectionIndex + 1}-${exerciseIndex + 1}`),
              name: String(exercise.name || '').trim() || `Exercise ${exerciseIndex + 1}`,
              details: String(exercise.details || '').trim() || 'Complete as assigned.',
              notes: String(exercise.notes || '').trim(),
              workout_id: String(exercise.workout_id || '').trim(),
              workout_title: String(exercise.workout_title || '').trim(),
              workout_vimeo_id: String(exercise.workout_vimeo_id || '').trim(),
              workout_video_url: String(exercise.workout_video_url || '').trim(),
              workout_video_source: String(exercise.workout_video_source || 'VIMEO').trim().toUpperCase() || 'VIMEO',
              workout_thumbnail: String(exercise.workout_thumbnail || '').trim(),
            }));
          const hasSectionContent =
            String(section?.title || '').trim() ||
            String(section?.description || '').trim() ||
            exercises.length > 0;
          if (!hasSectionContent) {
            return null;
          }
          return {
            id: section.id || createId(`section-${dayIndex + 1}-${sectionIndex + 1}`),
            title: String(section.title || '').trim() || `Section ${sectionIndex + 1}`,
            description: String(section.description || '').trim(),
            estimated_minutes: Number(section.estimated_minutes || 15),
            exercises,
          };
        })
        .filter(Boolean);
      const hasDayContent =
        String(day?.title || '').trim() ||
        String(day?.focus || '').trim() ||
        String(day?.notes || '').trim() ||
        sections.length > 0;
      if (!hasDayContent) {
        return null;
      }
      return {
        day_number: dayIndex + 1,
        title: String(day.title || '').trim() || `Day ${dayIndex + 1}`,
        focus: String(day.focus || '').trim() || 'Challenge work',
        notes: String(day.notes || '').trim(),
        sections,
      };
    })
    .filter(Boolean);
const categoryThemeByName = {
  Strength: { noun: 'Reset', focus: 'strength, movement quality, and consistency' },
  Cardio: { noun: 'Builder', focus: 'endurance, pacing, and cardio consistency' },
  Mindfulness: { noun: 'Flow', focus: 'mobility, recovery, and mindful daily practice' },
  Nutrition: { noun: 'Nutrition Reset', focus: 'meal consistency, energy, and nutrition habits' },
  Family: { noun: 'Family Fitness Plan', focus: 'shared movement, accountability, and family-friendly activity' },
};
const suggestChallengeTitle = ({ durationDays, category }) => {
  const safeDuration = Math.max(Number(durationDays || PLAN_GENERATION_DEFAULTS.durationDays), 1);
  const theme = categoryThemeByName[category] || categoryThemeByName.Strength;
  return `${safeDuration}-Day ${category} ${theme.noun}`;
};
const suggestChallengeDescription = ({ durationDays, category, difficulty }) => {
  const safeDuration = Math.max(Number(durationDays || PLAN_GENERATION_DEFAULTS.durationDays), 1);
  const theme = categoryThemeByName[category] || categoryThemeByName.Strength;
  return `A ${safeDuration}-day ${difficulty.toLowerCase()} ${category.toLowerCase()} challenge designed to improve ${theme.focus} with realistic day-by-day actions.`;
};
const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFileList, setThumbnailFileList] = useState([]);
  const [thumbnailCleared, setThumbnailCleared] = useState(false);
  const [planDays, setPlanDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [workoutLibrary, setWorkoutLibrary] = useState([]);
  const [workoutLibraryLoading, setWorkoutLibraryLoading] = useState(false);
  const [moderationChallenge, setModerationChallenge] = useState(null);
  const [moderationMessages, setModerationMessages] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationDeletingId, setModerationDeletingId] = useState('');
  const lastSuggestedTitleRef = useRef('');
  const lastSuggestedDescriptionRef = useRef('');
  const [form] = Form.useForm();
  const loadChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApiRequest('/admin/challenges');
      setChallenges(Array.isArray(response?.challenges) ? response.challenges : []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };
  const loadWorkoutLibrary = async () => {
    setWorkoutLibraryLoading(true);
    try {
      const response = await adminApiRequest('/admin/workouts');
      const nextWorkouts = Array.isArray(response?.workouts) ? response.workouts : [];
      setWorkoutLibrary(nextWorkouts);
      setPlanDays((current) => autoAttachWorkoutMatches(current, nextWorkouts));
    } catch (loadError) {
      message.error(loadError.message || 'Failed to load workout library');
    } finally {
      setWorkoutLibraryLoading(false);
    }
  };
  useEffect(() => {
    loadChallenges();
  }, []);
  const handleAdd = () => {
    setEditingChallenge(null);
    form.resetFields();
    form.setFieldsValue({
      title: '',
      description: '',
      whyItMatters: '',
      category: PLAN_GENERATION_DEFAULTS.category,
      durationDays: PLAN_GENERATION_DEFAULTS.durationDays,
      points: PLAN_GENERATION_DEFAULTS.points,
      status: PLAN_GENERATION_DEFAULTS.status,
    });
    setSelectedThumbnail(null);
    setThumbnailPreview('');
    setThumbnailFileList([]);
    setThumbnailCleared(false);
    setPlanDays([]);
    setActiveDayIndex(null);
    lastSuggestedTitleRef.current = '';
    lastSuggestedDescriptionRef.current = '';
    void loadWorkoutLibrary();
    setIsModalVisible(true);
  };
  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);
    const editValues = {
      title: challenge.title,
      description: challenge.description,
      whyItMatters: challenge.whyItMatters,
      category: challenge.category,
      durationDays: challenge.durationDays,
      points: challenge.points,
      status: challenge.status,
    };
    form.setFieldsValue(editValues);
    lastSuggestedTitleRef.current = suggestChallengeTitle({
      durationDays: challenge.durationDays,
      category: challenge.category,
    });
    lastSuggestedDescriptionRef.current = suggestChallengeDescription({
      durationDays: challenge.durationDays,
      category: challenge.category,
      difficulty: challenge.difficulty,
    });
    setPlanDays(normalizePlanDays(challenge.planDays || []));
    setActiveDayIndex(null);
    setSelectedThumbnail(null);
    setThumbnailPreview(challenge.thumbnail || '');
    setThumbnailFileList([]);
    setThumbnailCleared(false);
    void loadWorkoutLibrary();
    setIsModalVisible(true);
  };
  const handleThumbnailChange = async ({ fileList }) => {
    setThumbnailFileList(fileList.slice(-1));
    const file = fileList[fileList.length - 1]?.originFileObj;
    if (!file) {
      setSelectedThumbnail(null);
      return;
    }
    try {
      const payload = await toBase64Payload(file, "challenge-thumbnail.jpg");
      setSelectedThumbnail(payload);
      setThumbnailPreview(payload.preview);
      setThumbnailCleared(false);
    } catch {
      message.error('Failed to read thumbnail image');
    }
  };
  const handleThumbnailRemove = () => {
    setSelectedThumbnail(null);
    setThumbnailFileList([]);
    setThumbnailPreview('');
    setThumbnailCleared(true);
  };
  const updatePlanDay = (dayIndex, updater) => {
    setPlanDays((current) => current.map((day, index) => (index === dayIndex ? updater(day) : day)));
  };
  const addPlanDay = () => {
    setPlanDays((current) => {
      const nextDays = [...current, createEmptyDay(current.length + 1)];
      form.setFieldsValue({ durationDays: nextDays.length });
      setActiveDayIndex(nextDays.length - 1);
      return nextDays;
    });
  };
  const removePlanDay = (dayIndex) => {
    setPlanDays((current) =>
      current
        .filter((_, index) => index !== dayIndex)
        .map((day, index) => ({ ...day, day_number: index + 1, title: day.title || `Day ${index + 1}` }))
    );
    setActiveDayIndex((current) => {
      if (current === null) {
        return null;
      }
      if (current === dayIndex) {
        return null;
      }
      return current > dayIndex ? current - 1 : current;
    });
  };
  const openDayEditor = (dayIndex) => {
    setActiveDayIndex(dayIndex);
  };
  const addSection = (dayIndex) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: [...day.sections, createEmptySection()],
    }));
  };
  const removeSection = (dayIndex, sectionIndex) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.filter((_, index) => index !== sectionIndex),
    }));
  };
  const updateSection = (dayIndex, sectionIndex, field, value) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? { ...section, [field]: field === 'estimated_minutes' ? Number(value || 0) : value }
          : section
      )),
    }));
  };
  const addExercise = (dayIndex, sectionIndex) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? { ...section, exercises: [...section.exercises, createEmptyExercise()] }
          : section
      )),
    }));
  };
  const removeExercise = (dayIndex, sectionIndex, exerciseIndex) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? { ...section, exercises: section.exercises.filter((_, itemIndex) => itemIndex !== exerciseIndex) }
          : section
      )),
    }));
  };
  const updateExercise = (dayIndex, sectionIndex, exerciseIndex, field, value) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? {
              ...section,
              exercises: section.exercises.map((exercise, itemIndex) => (
                itemIndex === exerciseIndex
                  ? (() => {
                      const nextExercise = { ...exercise, [field]: value };
                      if (field !== 'name' || nextExercise.workout_vimeo_id || nextExercise.workout_id) {
                        return nextExercise;
                      }
                      const matchedWorkout = findMatchingWorkoutForExercise(value, workoutLibrary);
                      if (!matchedWorkout) {
                        return nextExercise;
                      }
                      return {
                        ...nextExercise,
                        workout_id: matchedWorkout.id,
                        workout_title: matchedWorkout.title,
                        workout_vimeo_id: matchedWorkout.vimeoId,
                        workout_video_url: matchedWorkout.videoUrl || '',
                        workout_video_source: matchedWorkout.videoSource || 'VIMEO',
                        workout_thumbnail: matchedWorkout.thumbnail || '',
                      };
                    })()
                  : exercise
              )),
            }
          : section
      )),
    }));
  };
  const updateExerciseVideoMeta = (dayIndex, sectionIndex, exerciseIndex, nextFields) => {
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? {
              ...section,
              exercises: section.exercises.map((exercise, itemIndex) => (
                itemIndex === exerciseIndex ? { ...exercise, ...nextFields } : exercise
              )),
            }
          : section
      )),
    }));
  };
  const linkExerciseWorkout = (dayIndex, sectionIndex, exerciseIndex, workoutId) => {
    const selectedWorkout = workoutLibrary.find((workout) => workout.id === workoutId);
    updatePlanDay(dayIndex, (day) => ({
      ...day,
      sections: day.sections.map((section, index) => (
        index === sectionIndex
          ? {
              ...section,
              exercises: section.exercises.map((exercise, itemIndex) => {
                if (itemIndex !== exerciseIndex) {
                  return exercise;
                }
                if (!selectedWorkout) {
                  return {
                    ...exercise,
                    workout_id: '',
                    workout_title: '',
                    workout_vimeo_id: '',
                    workout_video_url: '',
                    workout_video_source: 'VIMEO',
                    workout_thumbnail: '',
                  };
                }
                return {
                  ...exercise,
                  workout_id: selectedWorkout.id,
                  workout_title: selectedWorkout.title,
                  workout_vimeo_id: selectedWorkout.vimeoId,
                  workout_video_url: selectedWorkout.videoUrl || '',
                  workout_video_source: selectedWorkout.videoSource || 'VIMEO',
                  workout_thumbnail: selectedWorkout.thumbnail || '',
                };
              }),
            }
          : section
      )),
    }));
  };
  const loadThirtyDayPreset = async () => {
    const values = form.getFieldsValue();
    const requestedDuration = Math.max(Number(values.durationDays || PLAN_GENERATION_DEFAULTS.durationDays), 1);
    const selectedCategory = values.category || PLAN_GENERATION_DEFAULTS.category;
    const selectedDifficulty = values.difficulty || PLAN_GENERATION_DEFAULTS.difficulty;
    const generatedTitle = suggestChallengeTitle({
      durationDays: requestedDuration,
      category: selectedCategory,
    });
    const generatedDescription = suggestChallengeDescription({
      durationDays: requestedDuration,
      category: selectedCategory,
      difficulty: selectedDifficulty,
    });
    const payload = {
      title: values.title || generatedTitle,
      description: values.description || generatedDescription,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      durationDays: requestedDuration,
    };
    setPlanGenerating(true);
    try {
      const response = await adminApiRequest('/admin/challenges/generate-plan', {
        method: 'POST',
        body: payload,
      });
      const generatedPlanDays = normalizePlanDays(response?.planDays || []);
      setPlanDays(generatedPlanDays);
      setActiveDayIndex(generatedPlanDays.length > 0 ? 0 : null);
      form.setFieldsValue({
        title: response?.title || payload.title,
        description: response?.description || payload.description,
        durationDays: response?.durationDays || generatedPlanDays.length || payload.durationDays,
        category: selectedCategory,
        difficulty: selectedDifficulty,
      });
      message.success(`${response?.durationDays || generatedPlanDays.length || requestedDuration}-day plan generated`);
    } catch (loadError) {
      message.error(loadError.message || 'Failed to generate challenge plan');
    } finally {
      setPlanGenerating(false);
    }
  };
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await adminApiRequest(`/admin/challenges/${id}`, { method: 'DELETE' });
      setChallenges((prev) => prev.filter((challenge) => challenge.id !== id));
      message.success('Challenge deleted successfully');
    } catch (deleteError) {
      message.error(deleteError.message || 'Failed to delete challenge');
    } finally {
      setDeletingId('');
    }
  };
  const openModeration = async (challenge) => {
    setModerationChallenge(challenge);
    setModerationMessages([]);
    setModerationLoading(true);
    try {
      const response = await adminApiRequest(`/admin/challenges/${challenge.id}/chat`);
      setModerationMessages(Array.isArray(response?.messages) ? response.messages : []);
    } catch (loadError) {
      message.error(loadError.message || 'Failed to load challenge chat');
    } finally {
      setModerationLoading(false);
    }
  };
  const handleModerationDelete = async (messageId) => {
    if (!moderationChallenge) {
      return;
    }
    setModerationDeletingId(messageId);
    try {
      await adminApiRequest(`/admin/challenges/${moderationChallenge.id}/chat/messages/${messageId}`, {
        method: 'DELETE',
      });
      setModerationMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                content: '',
                image_url: '',
                is_deleted: true,
              }
            : item
        )
      );
      message.success('Chat message removed');
    } catch (deleteError) {
      message.error(deleteError.message || 'Failed to remove message');
    } finally {
      setModerationDeletingId('');
    }
  };
  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const normalizedPlanDays = sanitizePlanDaysForSubmit(planDays);
      const nextThumbnail = selectedThumbnail
        ? (editingChallenge?.thumbnail || '')
        : (thumbnailCleared ? '' : (thumbnailPreview || editingChallenge?.thumbnail || ''));
      const payload = {
        ...values,
        category: values.category || editingChallenge?.category || PLAN_GENERATION_DEFAULTS.category,
        difficulty: editingChallenge?.difficulty || PLAN_GENERATION_DEFAULTS.difficulty,
        durationDays: normalizedPlanDays.length > 0 ? normalizedPlanDays.length : values.durationDays,
        planDays: normalizedPlanDays,
        planText: normalizedPlanDays.length > 0 ? '' : (editingChallenge?.planText || values.planText || ''),
        thumbnail: nextThumbnail,
        image_base64: selectedThumbnail?.image_base64 || null,
        mime_type: selectedThumbnail?.mime_type || 'image/jpeg',
        file_name: selectedThumbnail?.file_name || null,
      };
      if (editingChallenge) {
        const updated = await adminApiRequest(`/admin/challenges/${editingChallenge.id}`, {
          method: 'PATCH',
          body: payload,
        });
        setChallenges((prev) => prev.map((challenge) => (challenge.id === editingChallenge.id ? updated : challenge)));
        message.success('Challenge updated successfully');
      } else {
        const created = await adminApiRequest('/admin/challenges', {
          method: 'POST',
          body: payload,
        });
        setChallenges((prev) => [created, ...prev]);
        message.success('Challenge added successfully');
      }
      setIsModalVisible(false);
    } catch (saveError) {
      message.error(saveError.message || 'Failed to save challenge');
    } finally {
      setSaving(false);
    }
  };
  const activeDay = activeDayIndex !== null ? planDays[activeDayIndex] : null;
  const workoutSelectOptions = workoutLibrary.map((workout) => ({
    label: `${workout.title} · Vimeo ${workout.vimeoId}`,
    value: workout.id,
  }));
  const filteredChallenges = challenges.filter((challenge) => statusFilter === 'ALL' || challenge.status === statusFilter);
  const statusToneMap = {
    ACTIVE: {
      card: 'border-l-cyan-400 shadow-cyan-500/10',
      badge: 'text-cyan-300 bg-cyan-400/10 ring-1 ring-cyan-400/20',
    },
    UPCOMING: {
      card: 'border-l-amber-400 shadow-amber-500/10',
      badge: 'text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/20',
    },
    DRAFT: {
      card: 'border-l-violet-400 shadow-violet-500/10',
      badge: 'text-violet-300 bg-violet-400/10 ring-1 ring-violet-400/20',
    },
    ARCHIVED: {
      card: 'border-l-slate-400 shadow-slate-500/10',
      badge: 'text-slate-300 bg-slate-400/10 ring-1 ring-slate-400/20',
    },
  };
  return (
    <div className="flex flex-col space-y-6 pt-2 h-full text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Challenges ({filteredChallenges.length})
          </h1>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <div className="flex flex-wrap gap-2">
            {challengeStatusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {status === 'ALL' ? 'All' : status}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-md"
          >
            <FiPlus />
            Add Challenge
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Spin size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-items-center gap-4 rounded-2xl border border-slate-700/50 p-4 shadow-xl md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredChallenges.map((challenge) => {
            const statusTone = statusToneMap[challenge.status] || statusToneMap.DRAFT;
            return (
            <div key={challenge.id} className="group relative flex w-full max-w-sm items-center gap-4 rounded-xl border border-[#334155] bg-[#1e293b] p-3 transition-all hover:border-slate-500 hover:bg-[#253245]">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-700">
                {challenge.thumbnail ? (
                  <img src={challenge.thumbnail} alt={challenge.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-800 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-orange-500 opacity-0 transition-opacity group-hover:opacity-100">
                  <FaFire className="text-2xl drop-shadow-md" />
                </div>
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="mb-1 truncate text-sm font-semibold text-slate-100" title={challenge.title}>{challenge.title}</h3>
                <p className="text-xs text-slate-400 truncate mb-2 mt-0.5">{challenge.category} · {challenge.durationDays} days</p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <span className="rounded bg-teal-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-300">{challenge.difficulty}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone.badge}`}>
                    {challenge.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1"><FaUsers /> {challenge.participantCount}</span>
                  <span className="inline-flex items-center gap-1"><FaTrophy /> {challenge.completionCount}</span>
                  <span className="font-semibold text-amber-300">+{challenge.points}</span>
                </div>
              </div>
              <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-100 transition-opacity sm:opacity-50 group-hover:opacity-100">
                <button title="Moderate Chat" onClick={() => openModeration(challenge)} className="text-slate-400 hover:text-cyan-400 transition-colors">
                  <FaComments size={15} />
                </button>
                <button title="Edit" onClick={() => handleEdit(challenge)} className="text-slate-400 hover:text-blue-400 transition-colors">
                  <FiEdit size={15} />
                </button>
                <Popconfirm
                  title="Delete the challenge"
                  description="Are you sure to delete this challenge?"
                  onConfirm={() => handleDelete(challenge.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <button title="Delete" disabled={deletingId === challenge.id} className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50">
                    <FiTrash2 size={15} />
                  </button>
                </Popconfirm>
              </div>
            </div>
          )})}
          {filteredChallenges.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-100 px-4 py-12 text-center text-sm font-medium text-slate-600">
              {challenges.length === 0 ? 'No challenges added yet.' : 'Challenges not found.'}
            </div>
          ) : null}
        </div>
      )}
      <Modal
        title={<span className="text-slate-900">{editingChallenge ? 'Edit Challenge' : 'Add New Challenge'}</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden
        width={920}
        className="workout-modal"
        styles={{
          header: {
            borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
            paddingInline: 24,
            paddingBlock: 18,
            background: 'rgba(255, 255, 255, 0.96)',
          },
          content: {
            background: '#f8fafc',
          },
          body: {
            paddingTop: 12,
            paddingBottom: 24,
            background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)',
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="title"
            label={<span className="font-medium text-slate-700">Challenge Title</span>}
            rules={[{ required: true, message: 'Please input the title' }]}
          >
            <Input placeholder="e.g. Summer Strength Reset" className={`${challengeInputClassName} py-2`} />
          </Form.Item>
          <Form.Item
            name="description"
            label={<span className="font-medium text-slate-700">What To Do</span>}
            rules={[{ required: true, message: 'Please input what members should do' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe what members should do in this challenge"
              className={challengeInputClassName}
            />
          </Form.Item>
          <Form.Item
            name="whyItMatters"
            label={<span className="font-medium text-slate-700">Why It Matters</span>}
          >
            <Input.TextArea
              rows={4}
              placeholder="Explain why this challenge matters and the outcome it supports"
              className={challengeInputClassName}
            />
          </Form.Item>
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Challenge Metadata</p>
              <h4 className="mt-1 text-sm font-semibold text-slate-900">Goal type, duration, points, and status</h4>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                name="category"
                label={<span className="font-medium text-slate-700">Goal Type</span>}
                rules={[{ required: true, message: 'Please select the goal type' }]}
              >
                <Select placeholder="Select goal type" size="large">
                  {challengeGoalTypeOptions.map((goalType) => (
                    <Select.Option key={goalType} value={goalType}>
                      {goalType}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="durationDays"
                label={<span className="font-medium text-slate-700">Duration Days</span>}
                rules={[{ required: true, message: 'Please input the duration' }]}
              >
                <InputNumber min={1} max={365} placeholder="e.g. 7" className="w-full" />
              </Form.Item>
              <Form.Item
                name="points"
                label={<span className="font-medium text-slate-700">Points</span>}
                rules={[{ required: true, message: 'Please input the points' }]}
              >
                <InputNumber min={0} max={100000} placeholder="e.g. 500" className="w-full" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item
                name="status"
                label={<span className="font-medium text-slate-700">Status</span>}
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                  <Select.Option value="UPCOMING">UPCOMING</Select.Option>
                  <Select.Option value="DRAFT">DRAFT</Select.Option>
                  <Select.Option value="ARCHIVED">ARCHIVED</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label={<span className="font-medium text-slate-700">Thumbnail</span>}>
                <div className="flex flex-col gap-2">
                  <Upload
                    accept="image/png,image/jpeg,image/webp"
                    beforeUpload={() => false}
                    multiple={false}
                    fileList={thumbnailFileList}
                    onChange={handleThumbnailChange}
                    onRemove={() => {
                      handleThumbnailRemove();
                      return false;
                    }}
                    showUploadList={false}
                    className="w-full"
                  >
                    <button
                      type="button"
                      className="flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
                    >
                      {thumbnailPreview ? (
                        <>
                          <img src={thumbnailPreview} alt="Challenge thumbnail preview" className="h-6 w-6 rounded-md object-cover" />
                          <span className="text-sm font-medium text-slate-700">Change thumbnail</span>
                        </>
                      ) : (
                        <>
                          <FiImage size={18} />
                          <span className="text-sm font-medium text-slate-700">Upload thumbnail</span>
                        </>
                      )}
                    </button>
                  </Upload>
                  {thumbnailPreview ? (
                    <Button danger type="text" className="self-start px-0" onClick={handleThumbnailRemove}>
                      Remove thumbnail
                    </Button>
                  ) : null}
                </div>
              </Form.Item>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200/80 pt-6">
            <Button size="large" onClick={() => setIsModalVisible(false)} className="border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50">
              Cancel
            </Button>
            <Button size="large" type="primary" htmlType="submit" className="bg-blue-600 hover:bg-blue-500 shadow-md" loading={saving}>
              {editingChallenge ? 'Update Challenge' : 'Add Challenge'}
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        title={
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <FiClock size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {activeDay ? `Edit Day ${activeDay.day_number}` : 'Edit Day'}
              </h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Manage day title, coaching notes, sections, and video links
              </p>
            </div>
          </div>
        }
        open={activeDayIndex !== null && Boolean(activeDay)}
        onCancel={() => setActiveDayIndex(null)}
        closeIcon={
          <div className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <FiX size={18} className="text-slate-500" />
          </div>
        }
        footer={null}
        width={980}
        destroyOnHidden
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
        {activeDay ? (
          <div className="mt-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                  DAY {activeDay.day_number} SETTINGS
                </span>
                <p className="mt-1 text-xs text-slate-400">Configure sections, workout notes, and library attachments for this training block.</p>
              </div>
              <Button 
                danger 
                type="default" 
                onClick={() => removePlanDay(activeDayIndex)}
                className="rounded-xl border-red-100 hover:border-red-200 bg-red-50/50 hover:bg-red-50 font-semibold text-xs h-8 text-red-600"
              >
                Remove Day
              </Button>
            </div>
            <div className="space-y-6">
              {/* Day General Settings Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day Title</span>
                    <Input
                      value={activeDay.title}
                      onChange={(event) => updatePlanDay(activeDayIndex, (currentDay) => ({ ...currentDay, title: event.target.value }))}
                      placeholder="e.g. Lower Body Focus"
                      className={`${challengeInputClassName} py-2`}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Day Focus (Subtitle)</span>
                    <Input
                      value={activeDay.focus}
                      onChange={(event) => updatePlanDay(activeDayIndex, (currentDay) => ({ ...currentDay, focus: event.target.value }))}
                      placeholder="e.g. Quad dominance & core activation"
                      className={`${challengeInputClassName} py-2`}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coaching Notes (Instructions)</span>
                  <Input.TextArea
                    rows={3}
                    value={activeDay.notes}
                    onChange={(event) => updatePlanDay(activeDayIndex, (currentDay) => ({ ...currentDay, notes: event.target.value }))}
                    placeholder="Provide detailed instructions or tips for the client..."
                    className={`${challengeInputClassName} !rounded-xl !border-slate-200`}
                  />
                </div>
              </div>
              {/* Day Sections List */}
              <div className="mt-4 space-y-4">
                {activeDay.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-200/50 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-[10px] font-bold text-blue-600">
                          {sectionIndex + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-800">Section {sectionIndex + 1}</h4>
                      </div>
                      <Button 
                        danger 
                        type="text" 
                        onClick={() => removeSection(activeDayIndex, sectionIndex)}
                        className="font-semibold text-xs text-red-500 hover:text-red-600"
                      >
                        Remove Section
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_160px]">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Title</span>
                        <Input
                          value={section.title}
                          onChange={(event) => updateSection(activeDayIndex, sectionIndex, 'title', event.target.value)}
                          placeholder="e.g. Dynamic Warm-up"
                          className={`${challengeInputClassName} py-2`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Time (Mins)</span>
                        <InputNumber
                          min={0}
                          max={240}
                          value={section.estimated_minutes}
                          onChange={(value) => updateSection(activeDayIndex, sectionIndex, 'estimated_minutes', value)}
                          placeholder="e.g. 15"
                          className="w-full rounded-xl border-slate-200 shadow-sm [&>.ant-input-number-input]:!py-1.5 hover:border-blue-300"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Section Description</span>
                      <Input.TextArea
                        rows={2}
                        value={section.description}
                        onChange={(event) => updateSection(activeDayIndex, sectionIndex, 'description', event.target.value)}
                        placeholder="e.g. Complete these movements back-to-back to elevate heart rate and prepare joints."
                        className={`${challengeInputClassName} !rounded-xl !border-slate-200`}
                      />
                    </div>
                    <div className="mt-5 space-y-4">
                      {section.exercises.map((exercise, exerciseIndex) => (
                        <div key={exercise.id} className="rounded-xl border border-slate-150 bg-white p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              EXERCISE {exerciseIndex + 1}
                            </span>
                            <Button 
                              danger 
                              type="text" 
                              onClick={() => removeExercise(activeDayIndex, sectionIndex, exerciseIndex)}
                              className="font-semibold text-xs text-red-500 hover:text-red-600 h-6 px-0"
                            >
                              Remove Exercise
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Exercise Name</span>
                              <Input
                                value={exercise.name}
                                onChange={(event) => updateExercise(activeDayIndex, sectionIndex, exerciseIndex, 'name', event.target.value)}
                                placeholder="e.g. Goblet Squat"
                                className={`${challengeInputClassName} py-2`}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Reps & Timing Details</span>
                              <Input
                                value={exercise.details}
                                onChange={(event) => updateExercise(activeDayIndex, sectionIndex, exerciseIndex, 'details', event.target.value)}
                                placeholder="e.g. 3 sets x 12 reps (tempo 2-0-2-0)"
                                className={`${challengeInputClassName} py-2`}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 mt-3">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Coaching Notes (Optional)</span>
                            <Input.TextArea
                              rows={2}
                              value={exercise.notes}
                              onChange={(event) => updateExercise(activeDayIndex, sectionIndex, exerciseIndex, 'notes', event.target.value)}
                              placeholder="e.g. Keep chest tall, drive knees outwards, control the descent."
                              className={`${challengeInputClassName} !rounded-xl !border-slate-200`}
                            />
                          </div>
                          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <div className="mb-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Instruction Video Source</p>
                              <p className="mt-0.5 text-[11px] text-slate-500">Provide a direct Vimeo Video ID, or bind a full video workout from your system library.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Video Display Label</span>
                                <Input
                                  value={exercise.workout_title}
                                  onChange={(event) => updateExerciseVideoMeta(activeDayIndex, sectionIndex, exerciseIndex, {
                                    workout_id: '',
                                    workout_title: event.target.value,
                                    workout_video_url: '',
                                    workout_video_source: 'VIMEO',
                                  })}
                                  placeholder="e.g. Squat Demo Video"
                                  className={`${challengeInputClassName} py-2`}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Vimeo Video ID</span>
                                <Input
                                  value={exercise.workout_vimeo_id}
                                  onChange={(event) => updateExerciseVideoMeta(activeDayIndex, sectionIndex, exerciseIndex, {
                                    workout_id: '',
                                    workout_vimeo_id: event.target.value.trim(),
                                    workout_video_url: '',
                                    workout_video_source: 'VIMEO',
                                  })}
                                  placeholder="e.g. 84729104"
                                  className={`${challengeInputClassName} py-2`}
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bind Library Workout</span>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                                <Select
                                  showSearch
                                  allowClear
                                  placeholder={workoutLibraryLoading ? 'Loading workout library...' : 'Select workout to attach...'}
                                  loading={workoutLibraryLoading}
                                  value={exercise.workout_id || undefined}
                                  options={workoutSelectOptions}
                                  optionFilterProp="label"
                                  onChange={(value) => linkExerciseWorkout(activeDayIndex, sectionIndex, exerciseIndex, value || '')}
                                  className="w-full [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!border-slate-200 hover:[&>.ant-select-selector]:!border-blue-300"
                                />
                                {exercise.workout_vimeo_id || exercise.workout_video_url ? (
                                  <div className="inline-flex items-center rounded-lg border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs text-sky-700 font-semibold shadow-sm">
                                    Linked: {exercise.workout_video_source || 'VIMEO'} ({exercise.workout_vimeo_id || 'ID Bound'})
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={() => addExercise(activeDayIndex, sectionIndex)} 
                        type="dashed"
                        className="rounded-xl hover:border-blue-500 hover:text-blue-600 font-semibold text-xs"
                      >
                        Add Exercise Card
                      </Button>
                  </div>
                </div>
              ))}
            </div>
              <div className="mt-6 flex justify-between gap-3 border-t border-slate-100 pt-5">
                <Button 
                  onClick={() => addSection(activeDayIndex)} 
                  type="dashed"
                  className="rounded-xl border-slate-200 hover:border-blue-500 hover:text-blue-600 font-semibold"
                >
                  Add Section Block
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => setActiveDayIndex(null)} 
                  className="bg-blue-600 hover:bg-blue-500 shadow-md rounded-xl font-semibold px-6"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal
        title={<span className="text-slate-800">Challenge Chat Moderation</span>}
        open={Boolean(moderationChallenge)}
        onCancel={() => setModerationChallenge(null)}
        footer={null}
        width={860}
        destroyOnHidden
      >
        <div className="mt-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">{moderationChallenge?.title}</h3>
            <p className="text-sm text-slate-500">{moderationChallenge?.category} · {moderationChallenge?.durationDays} days</p>
          </div>
          {moderationLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spin size="large" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
              {moderationMessages.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{item.author_name}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{item.message_type}</span>
                        {item.is_deleted ? <span className="text-[10px] font-semibold uppercase tracking-wide text-red-500">Deleted</span> : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                        {item.is_deleted ? 'Message deleted' : item.content || (item.image_url ? 'Image attachment' : '')}
                      </p>
                      {item.image_url && !item.is_deleted ? (
                        <img src={item.image_url} alt="Challenge chat" className="mt-3 max-h-56 rounded-lg border border-slate-200 object-cover" />
                      ) : null}
                    </div>
                    {!item.is_deleted ? (
                      <Popconfirm
                        title="Remove this message?"
                        description="This will hide the message from the challenge chat."
                        onConfirm={() => handleModerationDelete(item.id)}
                        okText="Remove"
                        cancelText="Cancel"
                      >
                        <button
                          title="Delete Message"
                          disabled={moderationDeletingId === item.id}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </Popconfirm>
                    ) : null}
                  </div>
                </div>
              ))}
              {moderationMessages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No chat messages yet.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
export default Challenges;
