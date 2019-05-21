import _ from 'loadsh';
import Assessment from '@/services/assessment'
import lstore from '@/core/lstorage'

const { lsd } = lstore
const apiCore = new Assessment()

const initialState = {
  threadData: [],
  messageList: [],
  suggestions: {},
  additionalQuestions: [{
    question: 'When has it started?',
    response: 'Ok, got it',
    options: null,
    'input-type': 'choice',
    is_casespecific: false,
    is_hierarchical: false,
    tone: 'casual',
    topic: 'temporal-contexts'
  },{
    question: 'Do you have anything else to add?',
    response: 'Ok, got it',
    options: null,
    'input-type': 'choice',
    is_casespecific: false,
    is_hierarchical: false,
    tone: 'casual',
    topic: 'supplimentary'
  },{
    question: 'Alright, that’s all I need to know. Let me get the assessment ready',
    response: 'Ok, thank you',
    options: null,
    'input-type': 'choice',
    is_casespecific: false,
    is_hierarchical: false,
    tone: 'casual',
    topic: 'user-ratings'
  }]
};

const actions = {
  async fetchSuggestions({ commit }, id) {
    const res = await apiCore.getQuestionsByThreadId(id);

    if (res.data) {
      commit('fetchSuggestions', {
        data: res.data,
        meta: res.meta
      })
    }
  }
};

const mutations = {
  fetchSuggestions(state, payload) {
    state.suggestions = payload;
  },
  createAssessment(state, payload) {
    const assessments = Object.assign([], state.assessment);
    assessments.push(payload);

    state.assessments = assessments;
  },
  updateAssessmentById(state, payload) {
    const detailAssessments = Object.assign({}, state.detailAssessments);
    const currentDetailAssessments = detailAssessments[payload.assessmentId] || [];

    const index = _.findIndex(currentDetailAssessments, o => o.position == payload.data.position);

    if (index !== -1) {
      currentDetailAssessments[index] = payload.data;
    } else {
      currentDetailAssessments.push(payload.data);
    }

    detailAssessments[payload.assessmentId] = currentDetailAssessments;

    state.detailAssessments = null;
    state.detailAssessments = Object.assign({}, detailAssessments);
  },
};

const getters = {
  getAssessments(state) {
    return state.assessments;
  },
  getSuggestions(state) {
    return state.suggestions;
  },
};

export default {
  namespaced: true,
  state: initialState,
  getters,
  actions,
  mutations,
};
