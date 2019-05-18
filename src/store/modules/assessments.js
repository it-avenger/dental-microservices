import _ from 'loadsh';
import Assessment from '@/services/assessment'
import lstore from '@/core/lstorage'

const { lsd } = lstore
const apiCore = new Assessment()

const initialState = {
  threadData: [],
  messageList: [],
  suggestions: {}
};

const actions = {
  async fetchSuggestions({ commit }) {
    const res = await apiCore.getParams();
    const data = {}
    if (res.data) {
      const params = res.data.data.reduce((obj, value) => {
        const type = value.type
        if (data.hasOwnProperty(type)) {
          data[type].push(value)
        } else {
          data[type] = []
        }

        return {
          ...obj,
          [type]: data[type]
        }
      })

      commit('fetchSuggestions', {
        data: data,
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
